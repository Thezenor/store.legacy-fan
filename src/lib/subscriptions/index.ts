import type { Currency, PaymentProvider as ProviderEnum } from '@prisma/client';
type ClubType = string;
import { prisma } from '../prisma';
import { getSubscriptionProviderForAdmin, isGatewayEnabled } from '../payments';
import { getSettingString } from '../commerce/settings';
import { getClubPricing, getClubLaunchDate, getPlan } from '../commerce';
import { activateMembershipTx, renewMembershipTx } from '../members/membership';

import { appUrl } from '../app-url';

/** Modo (sandbox/live) configurado para una pasarela. */
async function providerMode(key: 'PAYPAL' | 'STRIPE'): Promise<'sandbox' | 'live'> {
  const m = await getSettingString(`${key.toLowerCase()}.mode`);
  return m === 'live' ? 'live' : 'sandbox';
}

/**
 * Clave del plan de suscripción en SystemSetting. Incluye FASE e IMPORTE porque
 * el precio depende de la fase y un plan de la pasarela tiene precio FIJO (no se
 * puede editar): cada fase/precio tiene su propio plan.
 * Ej.: `paypal.sandbox.plan.PRIME.EUR.FASE_1.14900`.
 */
export function subscriptionPlanKey(
  key: 'PAYPAL' | 'STRIPE',
  mode: 'sandbox' | 'live',
  club: ClubType,
  currency: Currency,
  phaseKey: string,
  amountCents: number,
): string {
  return `${key.toLowerCase()}.${mode}.plan.${club}.${currency}.${phaseKey}.${amountCents}`;
}

/**
 * Resuelve (y crea si falta) el plan recurrente para la FASE y precio actuales.
 * Así la suscripción siempre cobra el precio vigente de la fase; al cambiar de
 * fase o de precio se usa/crea otro plan automáticamente.
 */
async function resolvePlanIdForCurrentPhase(opts: {
  provider: ReturnType<typeof getSubscriptionProviderForAdmin>;
  key: 'PAYPAL' | 'STRIPE';
  mode: 'sandbox' | 'live';
  club: ClubType;
  currency: Currency;
}): Promise<string> {
  const pricing = await getClubPricing(opts.club, opts.currency);
  const amountCents = pricing?.priceCents ?? 0;
  const phaseKey = pricing?.phaseKey ?? 'NA';
  if (amountCents <= 0) {
    throw new Error(`Sin precio de club para ${opts.club}/${opts.currency} (suscripción).`);
  }

  const settingKey = subscriptionPlanKey(
    opts.key,
    opts.mode,
    opts.club,
    opts.currency,
    phaseKey,
    amountCents,
  );
  const existing = await getSettingString(settingKey);
  if (existing) return existing;

  // No existe plan para esta fase/precio: lo creamos con el precio vigente.
  const plan = await getPlan(opts.club);
  const created = await opts.provider.createSubscriptionPlan({
    club: opts.club,
    name: `${plan?.name ?? opts.club} — Anual (${phaseKey})`,
    currency: opts.currency,
    amountCents,
    intervalMonths: 12,
  });
  await prisma.systemSetting.upsert({
    where: { key: settingKey },
    update: { value: created.planId },
    create: { key: settingKey, value: created.planId, group: 'payments' },
  });
  return created.planId;
}

/**
 * Inicia una suscripción recurrente (renovación anual) con la pasarela activa y
 * devuelve la URL de aprobación. La activación efectiva de la membresía llega por
 * webhook (BILLING.SUBSCRIPTION.ACTIVATED / invoice.paid).
 */
export async function startSubscription(opts: {
  userId: string;
  club: ClubType;
  currency: Currency;
  locale: string;
}): Promise<{ approveUrl: string }> {
  // Pasarela activa según el panel (PayPal preferente; Stripe si fuese el activo).
  const key: 'PAYPAL' | 'STRIPE' = (await isGatewayEnabled('PAYPAL'))
    ? 'PAYPAL'
    : (await isGatewayEnabled('STRIPE'))
      ? 'STRIPE'
      : (() => {
          throw new Error('gateway_disabled');
        })();
  const provider = getSubscriptionProviderForAdmin(key);
  const mode = await providerMode(key);
  // Plan de la FASE y precio actuales (se crea automáticamente si no existe).
  const planId = await resolvePlanIdForCurrentPhase({ provider, key, mode, club: opts.club, currency: opts.currency });

  const pricing = await getClubPricing(opts.club, opts.currency);
  const amountCents = pricing?.priceCents ?? 0;
  const payMode = mode === 'live' ? 'LIVE' : 'TEST';

  // Registro local en estado PENDIENTE (una suscripción por usuario).
  await prisma.subscription.upsert({
    where: { userId: opts.userId },
    update: {
      provider: key as ProviderEnum,
      mode: payMode,
      club: opts.club,
      currency: opts.currency,
      amountCents,
      status: 'PENDIENTE',
      cancelAtPeriodEnd: false,
    },
    create: {
      userId: opts.userId,
      provider: key as ProviderEnum,
      mode: payMode,
      club: opts.club,
      currency: opts.currency,
      amountCents,
      status: 'PENDIENTE',
    },
  });

  const result = await provider.createSubscription({
    planId,
    referenceId: opts.userId,
    amountCents,
    currency: opts.currency,
    returnUrl: `${appUrl()}/api/subscriptions/return?locale=${opts.locale}`,
    cancelUrl: `${appUrl()}/api/checkout/paypal/cancel?locale=${opts.locale}`,
  });

  await prisma.subscription.update({
    where: { userId: opts.userId },
    data: { providerSubscriptionId: result.providerSubscriptionId },
  });

  if (!result.approveUrl) throw new Error('La pasarela no devolvió URL de aprobación.');
  return { approveUrl: result.approveUrl };
}

/** Localiza la suscripción local por su id en la pasarela. */
async function findByProviderId(providerSubscriptionId: string) {
  return prisma.subscription.findUnique({ where: { providerSubscriptionId } });
}

/**
 * Primer cobro/activación de la suscripción: activa la membresía (asigna número
 * de socio permanente si es nuevo) y marca la suscripción ACTIVA. Idempotente.
 */
export async function reconcileSubscriptionActivated(providerSubscriptionId: string): Promise<void> {
  const sub = await findByProviderId(providerSubscriptionId);
  if (!sub) return;

  // Fin de periodo según la pasarela (si se puede consultar).
  let periodEnd: Date | undefined;
  try {
    const info = await getSubscriptionProviderForAdmin(sub.provider).getSubscription(providerSubscriptionId);
    periodEnd = info.currentPeriodEnd;
  } catch {
    /* si no se puede consultar, seguimos sin fecha remota */
  }

  const launchDate = await getClubLaunchDate(sub.club);
  const membership = await prisma.membership.findUnique({ where: { userId: sub.userId } });

  await prisma.$transaction(async (tx) => {
    if (membership && membership.status === 'SOCIO_ACTIVO') {
      // Ya socio: la activación cuenta como renovación del periodo.
      await renewMembershipTx(tx, sub.userId, periodEnd ?? null);
    } else {
      // Nuevo socio: alta con número permanente y primer periodo.
      await activateMembershipTx(tx, sub.userId, sub.club, launchDate);
      if (periodEnd) {
        await tx.membership.update({ where: { userId: sub.userId }, data: { endsAt: periodEnd } });
      }
    }
    await tx.subscription.update({
      where: { id: sub.id },
      data: { status: 'ACTIVA', currentPeriodEnd: periodEnd ?? sub.currentPeriodEnd },
    });
  });
}

/** Renovación periódica (cobro recurrente correcto): extiende la membresía. */
export async function reconcileSubscriptionRenewed(
  providerSubscriptionId: string,
  periodEnd?: Date,
): Promise<void> {
  const sub = await findByProviderId(providerSubscriptionId);
  if (!sub) return;

  // El fin de periodo de la pasarela es autoritativo; si no llega en el evento,
  // lo consultamos para que la extensión sea idempotente (no doble-extender).
  let end = periodEnd;
  if (!end) {
    try {
      const info = await getSubscriptionProviderForAdmin(sub.provider).getSubscription(providerSubscriptionId);
      end = info.currentPeriodEnd;
    } catch {
      /* sin fecha remota: renewMembershipTx sumará un año */
    }
  }

  await prisma.$transaction(async (tx) => {
    await renewMembershipTx(tx, sub.userId, end ?? null);
    await tx.subscription.update({
      where: { id: sub.id },
      data: { status: 'ACTIVA', currentPeriodEnd: end ?? sub.currentPeriodEnd },
    });
  });
}

/** Suscripción cancelada: no renovará. La membresía sigue activa hasta su fin. */
export async function reconcileSubscriptionCancelled(providerSubscriptionId: string): Promise<void> {
  const sub = await findByProviderId(providerSubscriptionId);
  if (!sub) return;
  await prisma.subscription.update({
    where: { id: sub.id },
    data: { status: 'CANCELADA', cancelAtPeriodEnd: true },
  });
}

/** Impago / suspensión: marca la suscripción y suspende la membresía. */
export async function reconcileSubscriptionSuspended(providerSubscriptionId: string): Promise<void> {
  const sub = await findByProviderId(providerSubscriptionId);
  if (!sub) return;
  await prisma.$transaction(async (tx) => {
    await tx.subscription.update({ where: { id: sub.id }, data: { status: 'PAGO_FALLIDO' } });
    await tx.membership
      .update({ where: { userId: sub.userId }, data: { status: 'SOCIO_SUSPENDIDO' } })
      .catch(() => {});
  });
}

/** Cancela la suscripción en la pasarela y localmente (acción de socio/admin). */
export async function cancelSubscription(userId: string, reason?: string): Promise<void> {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub?.providerSubscriptionId) return;
  await getSubscriptionProviderForAdmin(sub.provider).cancelSubscription(sub.providerSubscriptionId, reason);
  await prisma.subscription.update({
    where: { userId },
    data: { status: 'CANCELADA', cancelAtPeriodEnd: true },
  });
}
