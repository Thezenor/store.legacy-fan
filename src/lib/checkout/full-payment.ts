import type { Currency } from '@prisma/client';
type ClubType = string;
import { prisma } from '../prisma';
import { getPaymentProviderUnchecked, isGatewayEnabled } from '../payments';
import { getClubPricing, getClubLaunchDate } from '../commerce';
import { getSetting, getNumber } from '../commerce/settings';
import { activateMembershipTx } from '../members/membership';
import { createIncludedOrder } from '../members/order';
import { createInvoice } from '../members/invoice';
import { earnPointsOnPurchase } from '../points/earn';
import { activateReferralReward } from '../referrals/activate';
import { saveShippingToProfile } from '../members/shipping';

import { appUrl } from '../app-url';

async function paymentMode(): Promise<'TEST' | 'LIVE'> {
  return (await getSetting<string>('payments.mode')) === 'live' ? 'LIVE' : 'TEST';
}

/**
 * Inicia el pago completo de una membresía (doc 03). Si el usuario tiene una
 * reserva con depósito pagado, se descuenta automáticamente (paga el restante).
 * El club elegido aquí es el definitivo. Devuelve la URL de aprobación de PayPal.
 */
export async function startFullPayment(opts: {
  userId: string;
  club: ClubType;
  currency: Currency;
  locale: string;
  includedCoin?: 'a' | 'b' | null;
  secondCoin?: boolean;
  secondCoinCents?: number;
  secondCoinChoice?: string;
}) {
  const membership = await prisma.membership.findUnique({ where: { userId: opts.userId } });
  if (membership?.status === 'SOCIO_ACTIVO') {
    throw new Error('already_member');
  }

  const pricing = await getClubPricing(opts.club, opts.currency);
  if (!pricing) throw new Error('no_pricing');
  // La 2ª moneda (Prestige) se suma al total a pagar.
  const secondCoinCents = opts.secondCoin ? opts.secondCoinCents ?? 0 : 0;
  const fullCents = pricing.priceCents + secondCoinCents;

  // ¿Reserva con depósito pagado? Se reutiliza y se descuenta.
  const reservation = await prisma.reservation.findFirst({
    where: { userId: opts.userId, status: 'RESERVA_PENDIENTE' },
    orderBy: { createdAt: 'desc' },
  });

  if (!(await isGatewayEnabled('PAYPAL'))) throw new Error('gateway_disabled');

  // No mutamos la reserva existente hasta tener la orden de PayPal confirmada,
  // para no corromper una reserva pagada si el proveedor falla.
  const reusing = !!reservation;
  const reservationId = reservation
    ? reservation.id
    : (
        await prisma.reservation.create({
          data: {
            userId: opts.userId,
            type: 'PAGO_COMPLETO',
            club: opts.club,
            status: 'PENDIENTE_DE_PAGO',
            currency: opts.currency,
            amountPaidCents: 0,
            totalDueCents: fullCents,
            includedCoin: opts.includedCoin ?? null,
            secondCoin: secondCoinCents > 0,
            secondCoinCents,
            secondCoinChoice: opts.secondCoinChoice ?? null,
          },
        })
      ).id;
  const alreadyPaid = reservation ? reservation.amountPaidCents : 0;
  const remaining = Math.max(0, fullCents - alreadyPaid);

  try {
    const provider = getPaymentProviderUnchecked('PAYPAL');
    const order = await provider.createPayment({
      amountCents: remaining,
      currency: opts.currency,
      description: `Legacy Fan ${opts.club} — Pago completo`,
      referenceId: reservationId,
      returnUrl: `${appUrl()}/api/checkout/paypal/return?locale=${opts.locale}&intent=full`,
      cancelUrl: `${appUrl()}/api/checkout/paypal/cancel?locale=${opts.locale}`,
    });

    // Orden creada con éxito: ahora sí ajustamos la reserva reutilizada.
    if (reusing) {
      await prisma.reservation.update({
        where: { id: reservationId },
        data: {
          type: 'PAGO_COMPLETO',
          club: opts.club,
          totalDueCents: fullCents,
          includedCoin: opts.includedCoin ?? null,
          secondCoin: secondCoinCents > 0,
          secondCoinCents,
          secondCoinChoice: opts.secondCoinChoice ?? null,
        },
      });
    }

    await prisma.payment.create({
      data: {
        userId: opts.userId,
        reservationId,
        provider: 'PAYPAL',
        mode: await paymentMode(),
        status: 'PENDIENTE_DE_PAGO',
        currency: opts.currency,
        amountCents: remaining,
        providerRef: order.providerRef,
      },
    });

    if (!order.approveUrl) throw new Error('PayPal no devolvió URL de aprobación.');
    return { approveUrl: order.approveUrl, reservationId };
  } catch (e) {
    // Limpieza: si creamos una reserva nueva, la borramos; la reserva reutilizada
    // no se mutó antes de la orden, así que no hay nada que revertir en su caso.
    if (!reusing) {
      await prisma.reservation.delete({ where: { id: reservationId } }).catch(() => {});
    }
    throw e;
  }
}

/**
 * Activa TODO el pago completo en una sola transacción (doc 03): club definitivo,
 * número de socio (M5), pedido con productos incluidos, factura, puntos sobre
 * premium y recompensa de referido. Idempotente (corta si ya está PAGO_COMPLETO).
 * NO captura en PayPal: el cobro ya lo confirmó la captura o el webhook. Antes de
 * activar valida que lo cobrado cubra lo debido y en la misma divisa (anti-fraude).
 */
async function activateFullPayment(opts: {
  paymentId: string;
  paidAmountCents: number;
  paidCurrency: Currency;
  rawPayload?: unknown;
}): Promise<string | null> {
  const payment = await prisma.payment.findUnique({
    where: { id: opts.paymentId },
    include: { reservation: true },
  });
  if (!payment || !payment.reservationId || !payment.reservation) return null;
  if (payment.status === 'PAGO_COMPLETO') return payment.reservationId; // idempotente

  // Integridad: lo realmente cobrado debe cubrir lo debido y en la divisa correcta.
  if (opts.paidCurrency !== payment.currency || opts.paidAmountCents < payment.amountCents) {
    await prisma.auditLog.create({
      data: {
        action: 'payment.amount_mismatch',
        entity: 'Payment',
        entityId: payment.id,
        newValue: {
          expectedCents: payment.amountCents,
          paidCents: opts.paidAmountCents,
          expectedCurrency: payment.currency,
          paidCurrency: opts.paidCurrency,
        },
      },
    });
    return payment.reservationId; // discrepancia: no activar nada
  }

  const club = payment.reservation.club;
  if (!club) return payment.reservationId; // sin club definitivo no se puede activar

  // Config leída fuera de la transacción.
  const launchDate = await getClubLaunchDate(club);
  const ratio = await getNumber('points.ratio_per_currency_unit');
  const expiryYears = await getNumber('points.expiry_years');
  const fullCents = payment.reservation.totalDueCents;
  // Base de PREMIUM para puntos/recompensa: excluye el importe de la 2ª moneda,
  // que incluye valor spot del metal (regla: puntos solo sobre premium).
  const premiumCents = Math.max(0, fullCents - payment.reservation.secondCoinCents);
  // Recompensa de referido: 10% del premium (configurable en M8).
  const referralRewardCents = Math.round(premiumCents * 0.1);

  await prisma.$transaction(
    async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: 'PAGO_COMPLETO', rawPayload: (opts.rawPayload ?? {}) as object },
      });
      await tx.reservation.update({
        where: { id: payment.reservationId! },
        data: {
          status: 'PAGO_COMPLETO',
          amountPaidCents: payment.reservation!.amountPaidCents + opts.paidAmountCents,
        },
      });

      // Club definitivo + número de socio (M5)
      await activateMembershipTx(tx, payment.userId, club, launchDate);

      // Pedido con productos incluidos
      await createIncludedOrder(tx, {
        userId: payment.userId,
        club,
        currency: payment.currency,
        reservationId: payment.reservationId,
      });

      // Factura definitiva
      await createInvoice(tx, {
        paymentId: payment.id,
        totalCents: fullCents,
        currency: payment.currency,
        year: new Date().getFullYear(),
      });

      // Puntos solo sobre el premium (sin el spot de la 2ª moneda)
      await earnPointsOnPurchase(tx, {
        userId: payment.userId,
        premiumCents,
        currency: payment.currency,
        ratio: Number.isFinite(ratio) ? ratio : 1,
        expiryYears: Number.isFinite(expiryYears) ? expiryYears : 2,
      });

      // Recompensa de referido (si aplica)
      await activateReferralReward(tx, {
        referredUserId: payment.userId,
        rewardCents: referralRewardCents,
      });
    },
    { maxWait: 15000, timeout: 30000 },
  );

  return payment.reservationId;
}

/**
 * Captura el pago completo en PayPal (ruta de retorno del navegador) y activa.
 * Devuelve: reservationId si se procesó, 'pending' si la captura no está COMPLETED
 * (no mostrar éxito), o null si no se encontró el pago.
 */
export async function captureFullPaymentByOrder(orderId: string): Promise<string | 'pending' | null> {
  const payment = await prisma.payment.findFirst({
    where: { providerRef: orderId, provider: 'PAYPAL' },
  });
  if (!payment || !payment.reservationId) return null;
  if (payment.status === 'PAGO_COMPLETO') return payment.reservationId;

  const provider = getPaymentProviderUnchecked('PAYPAL');
  const result = await provider.capturePayment(orderId);
  if (result.status !== 'COMPLETED') return 'pending'; // PENDING/FAILED: no activar ni fingir éxito

  // Guarda la dirección de envío de PayPal en el perfil del socio.
  await saveShippingToProfile(payment.userId, result.shipping);

  return activateFullPayment({
    paymentId: payment.id,
    paidAmountCents: result.amountCents,
    paidCurrency: result.currency as Currency,
    rawPayload: result.raw,
  });
}

/**
 * Reconciliación idempotente del pago completo desde el webhook de PayPal
 * (PAYMENT.CAPTURE.COMPLETED). El cobro ya está confirmado por PayPal, así que
 * activa sin volver a capturar. `reservationId` = custom_id del evento.
 */
export async function reconcileFullPaymentPaid(reservationId: string, amountCents: number): Promise<void> {
  const payment = await prisma.payment.findFirst({
    where: { reservationId, provider: 'PAYPAL' },
    orderBy: { createdAt: 'desc' },
  });
  if (!payment) return;
  await activateFullPayment({
    paymentId: payment.id,
    paidAmountCents: amountCents,
    paidCurrency: payment.currency,
    rawPayload: { source: 'webhook', reservationId, amountCents },
  });
}
