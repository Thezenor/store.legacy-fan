import type { Currency } from '@prisma/client';
import { createHash } from 'node:crypto';
import { prisma } from '../prisma';
import {
  isAmbassadorProgramEnabled,
  getAmbassadorConfig,
  rewardForPlan,
  splitReward,
  type ModelKey,
} from './config';
import { lookupCode, resolveEffectiveCode } from './codes';

/** Hash corto (antifraude): nunca se guardan datos en claro sensibles. */
function h(s?: string | null): string | null {
  const v = (s ?? '').trim().toLowerCase();
  return v ? createHash('sha256').update(v).digest('hex').slice(0, 40) : null;
}

/**
 * Registra la ATRIBUCIÓN de un alta al crear la reserva. Es un no-op salvo que:
 *  - el programa esté ACTIVO (ambassador.enabled),
 *  - haya un código efectivo (escrito a mano > enlace/cookie),
 *  - el código exista y esté activo (no suspendido/cancelado),
 *  - la reserva no tenga ya atribución (un solo código por alta).
 * El cálculo de recompensa/descuento y las transiciones de estado se hacen en la
 * fase de ciclo de vida (al confirmarse el pago); aquí solo se guarda el código
 * en el pedido, como exige el Bloque 2 §3.1.
 */
export async function captureAmbassadorSignup(opts: {
  reservationId: string;
  userId: string;
  currency: Currency;
  plan?: string | null;
  typedCode?: string | null;
  linkOrCookieCode?: string | null;
  ip?: string | null;
  emailNorm?: string | null;
  billing?: string | null;
}): Promise<void> {
  if (!(await isAmbassadorProgramEnabled())) return;

  const raw = resolveEffectiveCode({ typed: opts.typedCode, linkOrCookie: opts.linkOrCookieCode });
  if (!raw) return;

  const found = await lookupCode(raw);
  if (!found || !found.active) return;

  const existing = await prisma.ambassadorSignup.findUnique({
    where: { reservationId: opts.reservationId },
    select: { id: true },
  });
  if (existing) return; // ya bloqueado desde el alta

  const selfPurchase = found.type === 'MEMBER' && found.referrerUserId === opts.userId;

  await prisma.ambassadorSignup.create({
    data: {
      reservationId: opts.reservationId,
      code: found.code,
      codeType: found.type,
      ambassadorId: found.type === 'AMBASSADOR' ? found.ambassadorId : null,
      referrerUserId: found.type === 'MEMBER' ? found.referrerUserId : null,
      plan: opts.plan ?? null,
      currency: opts.currency,
      // state por defecto RESERVADA; las transiciones (Pagada, En retención…) se
      // fijan en la fase de ciclo de vida con los eventos de pago.
      selfPurchase,
      ipHash: h(opts.ip),
      emailNorm: (opts.emailNorm ?? '').trim().toLowerCase() || null,
      billingNorm: h(opts.billing),
    },
  });
}

/**
 * Descuento (céntimos) a RESTAR del pago final por un código de embajador/socio.
 * Se llama al crear la orden de pago completo. Persiste el descuento/modelo/plan
 * en el alta para dejar constancia. No-op (0) si el programa está OFF o no hay
 * atribución. Si aún no existe alta pero llega un código (pago directo sin
 * reserva previa), la crea antes de calcular.
 *  - Modelo A → 0 · B → 15/30 · C → 7,50/15 · referido de socio → C (50/50).
 */
export async function ambassadorDiscountForFullPayment(opts: {
  reservationId: string;
  plan: string;
  userId: string;
  currency: Currency;
  code?: string | null;
  ip?: string | null;
  emailNorm?: string | null;
}): Promise<number> {
  if (!(await isAmbassadorProgramEnabled())) return 0;

  let signup = await prisma.ambassadorSignup.findUnique({
    where: { reservationId: opts.reservationId },
    include: { ambassador: { select: { model: true } } },
  });

  if (!signup && opts.code) {
    await captureAmbassadorSignup({
      reservationId: opts.reservationId,
      userId: opts.userId,
      currency: opts.currency,
      plan: opts.plan,
      typedCode: opts.code,
      ip: opts.ip,
      emailNorm: opts.emailNorm,
    });
    signup = await prisma.ambassadorSignup.findUnique({
      where: { reservationId: opts.reservationId },
      include: { ambassador: { select: { model: true } } },
    });
  }
  if (!signup) return 0;

  const cfg = await getAmbassadorConfig();
  const model: ModelKey = signup.codeType === 'MEMBER' ? 'C' : ((signup.ambassador?.model ?? 'A') as ModelKey);
  const { discountCents } = splitReward(rewardForPlan(opts.plan, cfg), model);

  await prisma.ambassadorSignup
    .update({ where: { reservationId: opts.reservationId }, data: { discountCents, model, plan: opts.plan } })
    .catch(() => {});
  return discountCents;
}
