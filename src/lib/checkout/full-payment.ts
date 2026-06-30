import type { Currency } from '@prisma/client';
type ClubType = string;
import { prisma } from '../prisma';
import { getPaymentProvider } from '../payments';
import { getClubPricing, getClubLaunchDate } from '../commerce';
import { getSetting, getNumber } from '../commerce/settings';
import { activateMembershipTx } from '../members/membership';
import { createIncludedOrder } from '../members/order';
import { createInvoice } from '../members/invoice';
import { earnPointsOnPurchase } from '../points/earn';
import { activateReferralReward } from '../referrals/activate';

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

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
}) {
  const membership = await prisma.membership.findUnique({ where: { userId: opts.userId } });
  if (membership?.status === 'SOCIO_ACTIVO') {
    throw new Error('already_member');
  }

  const pricing = await getClubPricing(opts.club, opts.currency);
  if (!pricing) throw new Error('no_pricing');
  const fullCents = pricing.priceCents;

  // ¿Reserva con depósito pagado? Se reutiliza y se descuenta.
  const reservation = await prisma.reservation.findFirst({
    where: { userId: opts.userId, status: 'RESERVA_PENDIENTE' },
    orderBy: { createdAt: 'desc' },
  });

  let reservationId: string;
  let alreadyPaid = 0;
  if (reservation) {
    alreadyPaid = reservation.amountPaidCents;
    reservationId = reservation.id;
    await prisma.reservation.update({
      where: { id: reservation.id },
      data: { type: 'PAGO_COMPLETO', club: opts.club, totalDueCents: fullCents },
    });
  } else {
    const created = await prisma.reservation.create({
      data: {
        userId: opts.userId,
        type: 'PAGO_COMPLETO',
        club: opts.club,
        status: 'PENDIENTE_DE_PAGO',
        currency: opts.currency,
        amountPaidCents: 0,
        totalDueCents: fullCents,
      },
    });
    reservationId = created.id;
  }

  const remaining = Math.max(0, fullCents - alreadyPaid);

  const provider = getPaymentProvider('PAYPAL');
  const order = await provider.createPayment({
    amountCents: remaining,
    currency: opts.currency,
    description: `Legacy Fan ${opts.club} — Pago completo`,
    referenceId: reservationId,
    returnUrl: `${appUrl()}/api/checkout/paypal/return?locale=${opts.locale}&intent=full`,
    cancelUrl: `${appUrl()}/api/checkout/paypal/cancel?locale=${opts.locale}`,
  });

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
}

/**
 * Captura el pago completo y, en una sola transacción, activa todo (doc 03):
 * club definitivo, número de socio (M5), pedido con productos incluidos, factura,
 * puntos sobre premium y recompensa de referido. Idempotente.
 */
export async function captureFullPaymentByOrder(orderId: string): Promise<string | null> {
  const payment = await prisma.payment.findFirst({
    where: { providerRef: orderId, provider: 'PAYPAL' },
    include: { reservation: true },
  });
  if (!payment || !payment.reservationId || !payment.reservation) return null;
  if (payment.status === 'PAGO_COMPLETO') return payment.reservationId;

  const provider = getPaymentProvider('PAYPAL');
  const result = await provider.capturePayment(orderId);
  if (result.status !== 'COMPLETED') return payment.reservationId;

  const club = payment.reservation.club;
  if (!club) return payment.reservationId; // sin club definitivo no se puede activar

  // Config leída fuera de la transacción.
  const launchDate = await getClubLaunchDate(club);
  const ratio = await getNumber('points.ratio_per_currency_unit');
  const expiryYears = await getNumber('points.expiry_years');
  const fullCents = payment.reservation.totalDueCents;
  // Recompensa de referido: 10% del premium (configurable en M8).
  const referralRewardCents = Math.round(fullCents * 0.1);

  await prisma.$transaction(
    async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: 'PAGO_COMPLETO', rawPayload: result.raw as object },
      });
      await tx.reservation.update({
        where: { id: payment.reservationId! },
        data: {
          status: 'PAGO_COMPLETO',
          amountPaidCents: payment.reservation!.amountPaidCents + result.amountCents,
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

      // Puntos sobre premium (membresía = premium íntegro)
      await earnPointsOnPurchase(tx, {
        userId: payment.userId,
        premiumCents: fullCents,
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
