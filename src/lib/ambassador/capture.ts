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

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'yopmail.com', 'guerrillamail.com', 'sharklasers.com', '10minutemail.com',
  'temp-mail.org', 'tempmail.com', 'trashmail.com', 'getnada.com', 'maildrop.cc', 'dispostable.com',
  'throwawaymail.com', 'fakeinbox.com', 'moakt.com', 'mohmal.com',
]);

function isDisposableEmail(email?: string | null): boolean {
  const dom = (email ?? '').split('@')[1]?.toLowerCase().trim();
  return !!dom && DISPOSABLE_DOMAINS.has(dom);
}

/**
 * Flags antifraude automáticos (Bloque 2 §7). Devuelve la lista de motivos; si
 * hay alguno, el alta se marca EN_REVISION (congela recompensa, no bloquea el
 * pedido del cliente). Se evalúa en la captura con lo disponible.
 */
async function computeFraudFlags(opts: {
  code: string;
  emailNorm?: string | null;
  billingHash?: string | null;
  isSelfPurchase: boolean;
  hadSelfPurchaseBefore: boolean;
}): Promise<string[]> {
  const flags: string[] = [];
  // Ráfaga: >3 altas del mismo código en la última hora.
  const oneHourAgo = new Date(Date.now() - 3600_000);
  const recent = await prisma.ambassadorSignup.count({ where: { code: opts.code, createdAt: { gte: oneHourAgo } } });
  if (recent >= 3) flags.push('burst');
  // Email desechable.
  if (isDisposableEmail(opts.emailNorm)) flags.push('disposable_email');
  // Misma facturación repetida en >2 altas del mismo código.
  if (opts.billingHash) {
    const same = await prisma.ambassadorSignup.count({ where: { code: opts.code, billingNorm: opts.billingHash } });
    if (same >= 2) flags.push('same_billing');
  }
  // Segunda autocompra (la primera está permitida; la segunda a revisión).
  if (opts.isSelfPurchase && opts.hadSelfPurchaseBefore) flags.push('self_purchase_repeat');
  return flags;
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

  const billingHash = h(opts.billing);
  const emailNorm = (opts.emailNorm ?? '').trim().toLowerCase() || null;

  // Autocompra: socio → coincide el referidor; embajador → compra con su propia
  // cuenta enlazada.
  let selfPurchase = found.type === 'MEMBER' && found.referrerUserId === opts.userId;
  if (found.type === 'AMBASSADOR') {
    const amb = await prisma.ambassador.findUnique({ where: { id: found.ambassadorId }, select: { userId: true } });
    if (amb?.userId && amb.userId === opts.userId) selfPurchase = true;
  }
  const hadSelfPurchaseBefore =
    selfPurchase && (await prisma.ambassadorSignup.count({ where: { code: found.code, selfPurchase: true } })) > 0;

  const flags = await computeFraudFlags({ code: found.code, emailNorm, billingHash, isSelfPurchase: selfPurchase, hadSelfPurchaseBefore });

  await prisma.ambassadorSignup.create({
    data: {
      reservationId: opts.reservationId,
      code: found.code,
      codeType: found.type,
      ambassadorId: found.type === 'AMBASSADOR' ? found.ambassadorId : null,
      referrerUserId: found.type === 'MEMBER' ? found.referrerUserId : null,
      plan: opts.plan ?? null,
      currency: opts.currency,
      // Si hay flags antifraude → EN_REVISION (congela recompensa, no bloquea el
      // pedido). Si no, queda en el estado por defecto RESERVADA.
      state: flags.length ? 'EN_REVISION' : undefined,
      notes: flags.length ? `flags: ${flags.join(', ')}` : null,
      selfPurchase,
      ipHash: h(opts.ip),
      emailNorm,
      billingNorm: billingHash,
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
