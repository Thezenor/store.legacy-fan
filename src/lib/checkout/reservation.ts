import type { Currency } from '@prisma/client';
type ClubType = string;
import { prisma } from '../prisma';
import { getPaymentProviderUnchecked, isGatewayEnabled } from '../payments';
import { getClubPricing, getReservationTerms } from '../commerce';
import { getSetting } from '../commerce/settings';
import { saveShippingToProfile } from '../members/shipping';
import { reserveMembershipTx } from '../members/membership';

import { appUrl } from '../app-url';

async function paymentMode(): Promise<'TEST' | 'LIVE'> {
  const mode = await getSetting<string>('payments.mode');
  return mode === 'live' ? 'LIVE' : 'TEST';
}

/** ¿El usuario ya tiene una reserva o membresía activa? (doc 03: 1 email = 1 activa). */
export async function hasActiveReservationOrMembership(userId: string): Promise<boolean> {
  const [reservation, membership] = await Promise.all([
    prisma.reservation.findFirst({
      where: { userId, status: { in: ['RESERVA_PENDIENTE', 'PENDIENTE_DE_PAGO', 'PAGO_COMPLETO'] } },
      select: { id: true },
    }),
    prisma.membership.findUnique({ where: { userId }, select: { id: true } }),
  ]);
  return !!reservation || !!membership;
}

export interface StartReservationResult {
  approveUrl: string;
  reservationId: string;
}

/**
 * Crea una reserva genérica de 50 €/$ (doc 03) y su pago PayPal asociado.
 * El club es una preselección no vinculante; se confirma en el pago completo (M6).
 * Devuelve la URL de aprobación de PayPal a la que redirigir al usuario.
 */
export async function startReservation(opts: {
  userId: string;
  club: ClubType | null;
  currency: Currency;
  locale: string;
  includedCoin?: 'a' | 'b' | null;
  secondCoin?: boolean;
  secondCoinCents?: number;
  secondCoinChoice?: string;
}): Promise<StartReservationResult> {
  const terms = await getReservationTerms(opts.currency, undefined, opts.club ?? undefined);
  const fullPricing = opts.club ? await getClubPricing(opts.club, opts.currency) : null;
  const secondCoinCents = opts.secondCoin ? opts.secondCoinCents ?? 0 : 0;

  const reservation = await prisma.reservation.create({
    data: {
      userId: opts.userId,
      type: 'RESERVA',
      club: opts.club,
      status: 'PENDIENTE_DE_PAGO',
      currency: opts.currency,
      amountPaidCents: 0,
      // La 2ª moneda se cobra en el pago completo; aquí solo se registra la elección.
      totalDueCents: (fullPricing?.priceCents ?? 0) + secondCoinCents,
      includedCoin: opts.includedCoin ?? null,
      secondCoin: secondCoinCents > 0,
      secondCoinCents,
      secondCoinChoice: opts.secondCoinChoice ?? null,
      launchDate: terms.launchDate,
      expiresAt: terms.expiresAt,
      refundableUntil: terms.refundableUntil,
    },
  });

  if (!(await isGatewayEnabled('PAYPAL'))) {
    await prisma.reservation.delete({ where: { id: reservation.id } }).catch(() => {});
    throw new Error('gateway_disabled');
  }

  // Si PayPal falla (sin credenciales, error de red…), revertimos la reserva
  // para no dejar filas huérfanas que bloqueen futuros intentos del usuario.
  // Importe a cobrar ahora: depósito de membresía + lo elegido para la 2ª moneda
  // (depósito de 50 si "reservar", o su precio con descuento si "pagarla ahora").
  const chargeCents = terms.amountCents + secondCoinCents;

  try {
    const provider = getPaymentProviderUnchecked('PAYPAL');
    const order = await provider.createPayment({
      amountCents: chargeCents,
      currency: opts.currency,
      description: secondCoinCents > 0 ? 'Legacy Fan Club — Reserva + 2ª moneda' : 'Legacy Fan Club — Reserva',
      referenceId: reservation.id,
      returnUrl: `${appUrl()}/api/checkout/paypal/return?locale=${opts.locale}`,
      cancelUrl: `${appUrl()}/api/checkout/paypal/cancel?locale=${opts.locale}`,
    });

    await prisma.payment.create({
      data: {
        userId: opts.userId,
        reservationId: reservation.id,
        provider: 'PAYPAL',
        mode: await paymentMode(),
        status: 'PENDIENTE_DE_PAGO',
        currency: opts.currency,
        amountCents: chargeCents,
        providerRef: order.providerRef,
      },
    });

    if (!order.approveUrl) throw new Error('PayPal no devolvió URL de aprobación.');
    return { approveUrl: order.approveUrl, reservationId: reservation.id };
  } catch (e) {
    await prisma.reservation.delete({ where: { id: reservation.id } }).catch(() => {});
    throw e;
  }
}

/**
 * Captura el pago de la reserva tras la aprobación en PayPal. Idempotente:
 * si ya estaba capturado, no duplica. Devuelve el id de reserva o null.
 */
export async function captureReservationByOrder(orderId: string): Promise<string | null> {
  const payment = await prisma.payment.findFirst({
    where: { providerRef: orderId, provider: 'PAYPAL' },
    include: { reservation: true },
  });
  if (!payment || !payment.reservationId) return null;
  if (payment.status === 'PAGO_COMPLETO') return payment.reservationId; // ya procesado

  const provider = getPaymentProviderUnchecked('PAYPAL');
  const result = await provider.capturePayment(orderId);
  if (result.status !== 'COMPLETED') return payment.reservationId;

  // Integridad (auditoría): lo cobrado debe cubrir el importe esperado y en la
  // misma divisa; si no, no se marca pagada (queda constancia en auditoría).
  if (result.amountCents < payment.amountCents || result.currency !== payment.currency) {
    await prisma.auditLog.create({
      data: {
        actorId: payment.userId,
        action: 'reservation.capture_amount_mismatch',
        entity: 'Reservation',
        entityId: payment.reservationId,
        newValue: {
          expectedCents: payment.amountCents,
          paidCents: result.amountCents,
          expectedCurrency: payment.currency,
          paidCurrency: result.currency,
          orderId,
        },
      },
    });
    return payment.reservationId;
  }

  const reservationClub = payment.reservation?.club ?? null;
  await prisma.$transaction(
    async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: 'PAGO_COMPLETO', rawPayload: result.raw as object },
      });
      await tx.reservation.update({
        where: { id: payment.reservationId! },
        // Depósito pagado: reserva activa, pendiente de pago completo (doc 08).
        data: { status: 'RESERVA_PENDIENTE', amountPaidCents: result.amountCents },
      });
      // Nuevo modelo: la reserva de 50 €/$ YA asigna el número de socio.
      await reserveMembershipTx(tx, payment.userId, reservationClub);
      await tx.auditLog.create({
        data: {
          actorId: payment.userId,
          action: 'reservation.deposit_captured',
          entity: 'Reservation',
          entityId: payment.reservationId!,
          newValue: { amountCents: result.amountCents, orderId },
        },
      });
    },
    { maxWait: 15000, timeout: 30000 },
  );

  // Guarda la dirección de envío facilitada por PayPal en el perfil.
  await saveShippingToProfile(payment.userId, result.shipping);

  return payment.reservationId;
}

/**
 * Reconciliación idempotente desde webhook PayPal (PAYMENT.CAPTURE.COMPLETED).
 * Marca la reserva como depósito pagado si aún no lo estaba. `customId` = reservationId.
 */
export async function reconcileReservationPaid(customId: string, amountCents: number): Promise<void> {
  const reservation = await prisma.reservation.findUnique({ where: { id: customId } });
  if (!reservation) return;
  if (reservation.status === 'RESERVA_PENDIENTE' || reservation.status === 'PAGO_COMPLETO') return;

  // Integridad: lo cobrado debe cubrir el importe esperado del depósito.
  const pendingPayment = await prisma.payment.findFirst({
    where: { reservationId: customId, provider: 'PAYPAL', status: 'PENDIENTE_DE_PAGO' },
    orderBy: { createdAt: 'desc' },
  });
  if (pendingPayment && amountCents < pendingPayment.amountCents) {
    await prisma.auditLog.create({
      data: {
        actorId: reservation.userId,
        action: 'reservation.amount_mismatch',
        entity: 'Reservation',
        entityId: customId,
        newValue: { expectedCents: pendingPayment.amountCents, paidCents: amountCents },
      },
    });
    return; // no marcar pagado si el importe no cuadra
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.reservation.update({
        where: { id: customId },
        data: { status: 'RESERVA_PENDIENTE', amountPaidCents: amountCents },
      });
      await tx.payment.updateMany({
        where: { reservationId: customId, status: 'PENDIENTE_DE_PAGO' },
        data: { status: 'PAGO_COMPLETO' },
      });
      // Nuevo modelo: la reserva ya asigna el número de socio.
      await reserveMembershipTx(tx, reservation.userId, reservation.club);
      await tx.auditLog.create({
        data: {
          action: 'reservation.deposit_reconciled_webhook',
          entity: 'Reservation',
          entityId: customId,
          newValue: { amountCents },
        },
      });
    },
    { maxWait: 15000, timeout: 30000 },
  );
}
