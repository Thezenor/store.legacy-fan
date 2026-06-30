import type { Currency } from '@prisma/client';
type ClubType = string;
import { prisma } from '../prisma';
import { getPaymentProviderUnchecked, isGatewayEnabled } from '../payments';
import { getClubPricing, getReservationTerms } from '../commerce';
import { getSetting } from '../commerce/settings';

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

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
}): Promise<StartReservationResult> {
  const terms = await getReservationTerms(opts.currency, undefined, opts.club ?? undefined);
  const fullPricing = opts.club ? await getClubPricing(opts.club, opts.currency) : null;

  const reservation = await prisma.reservation.create({
    data: {
      userId: opts.userId,
      type: 'RESERVA',
      club: opts.club,
      status: 'PENDIENTE_DE_PAGO',
      currency: opts.currency,
      amountPaidCents: 0,
      totalDueCents: fullPricing?.priceCents ?? 0,
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
  try {
    const provider = getPaymentProviderUnchecked('PAYPAL');
    const order = await provider.createPayment({
      amountCents: terms.amountCents,
      currency: opts.currency,
      description: 'Legacy Fan Club — Reserva',
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
        amountCents: terms.amountCents,
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

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'PAGO_COMPLETO', rawPayload: result.raw as object },
    }),
    prisma.reservation.update({
      where: { id: payment.reservationId },
      // Depósito pagado: reserva activa, pendiente de pago completo (doc 08).
      data: { status: 'RESERVA_PENDIENTE', amountPaidCents: result.amountCents },
    }),
    prisma.auditLog.create({
      data: {
        actorId: payment.userId,
        action: 'reservation.deposit_captured',
        entity: 'Reservation',
        entityId: payment.reservationId,
        newValue: { amountCents: result.amountCents, orderId },
      },
    }),
  ]);

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

  await prisma.$transaction([
    prisma.reservation.update({
      where: { id: customId },
      data: { status: 'RESERVA_PENDIENTE', amountPaidCents: amountCents },
    }),
    prisma.payment.updateMany({
      where: { reservationId: customId, status: 'PENDIENTE_DE_PAGO' },
      data: { status: 'PAGO_COMPLETO' },
    }),
    prisma.auditLog.create({
      data: {
        action: 'reservation.deposit_reconciled_webhook',
        entity: 'Reservation',
        entityId: customId,
        newValue: { amountCents },
      },
    }),
  ]);
}
