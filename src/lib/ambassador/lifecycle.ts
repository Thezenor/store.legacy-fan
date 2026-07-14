import { prisma } from '../prisma';
import { getAmbassadorConfig, rewardForPlan, splitReward, type ModelKey } from './config';

// Ciclo de vida de un alta con código (Bloque 2 §4). Todas las funciones operan
// solo si existe atribución para la reserva; si el programa estaba desactivado
// no hay AmbassadorSignup y son no-op naturalmente.

const DONE = ['PAGADA', 'EN_RETENCION', 'VALIDADA', 'LIQUIDADA'] as const;

/** Depósito de reserva pagado: marca la fecha (estado permanece RESERVADA). */
export async function onReservePaid(reservationId: string): Promise<void> {
  const s = await prisma.ambassadorSignup.findUnique({
    where: { reservationId },
    select: { id: true, reservePaidAt: true },
  });
  if (!s || s.reservePaidAt) return;
  await prisma.ambassadorSignup.update({
    where: { reservationId },
    data: { reservePaidAt: new Date() },
  }).catch(() => {});
}

/**
 * Pago total confirmado: devengo. Calcula recompensa (embajador) y descuento
 * (cliente) según el modelo, fija la retención y pasa a EN_RETENCION.
 *  - Referido de socio (MEMBER) → modelo C (50/50), siempre devenga (crédito).
 *  - Embajador → su modelo; NO devenga (reward 0) si está suspendido o sin
 *    reactivar (el descuento al cliente SÍ se mantiene).
 * Idempotente: no reprocesa un alta ya pagada/validada/liquidada.
 */
export async function onFullPaid(reservationId: string, opts: { plan: string }): Promise<void> {
  const s = await prisma.ambassadorSignup.findUnique({
    where: { reservationId },
    include: { ambassador: { select: { model: true, status: true, reactivateBy: true } } },
  });
  if (!s) return;
  if (s.fullPaidAt) return; // ya procesado el pago total (idempotente)
  if ((DONE as readonly string[]).includes(s.state)) return;

  const cfg = await getAmbassadorConfig();
  const model: ModelKey = s.codeType === 'MEMBER' ? 'C' : ((s.ambassador?.model ?? 'A') as ModelKey);
  const total = rewardForPlan(opts.plan, cfg);
  const { rewardCents, discountCents } = splitReward(total, model);

  const lapsed = s.ambassador?.reactivateBy ? new Date(s.ambassador.reactivateBy).getTime() < Date.now() : false;
  const suspended = s.ambassador ? s.ambassador.status !== 'ACTIVO' : false;
  const earns = s.codeType === 'MEMBER' ? true : !lapsed && !suspended;

  // Si el alta está EN_REVISION (flag antifraude), el pago se registra pero la
  // recompensa queda CONGELADA hasta que el equipo la resuelva (no pasa a
  // retención ni devenga). El descuento al cliente ya se aplicó igualmente.
  const inReview = s.state === 'EN_REVISION';
  const retentionUntil = inReview ? null : new Date(Date.now() + cfg.retentionDays * 86400000);
  await prisma.ambassadorSignup.update({
    where: { reservationId },
    data: {
      plan: opts.plan,
      model,
      rewardCents: inReview ? 0 : earns ? rewardCents : 0,
      discountCents,
      fullPaidAt: new Date(),
      retentionUntil,
      state: inReview ? 'EN_REVISION' : 'EN_RETENCION',
    },
  }).catch(() => {});
}

/** Reembolso/impago: revierte el alta (chargeback lo asume Legacy Fan, sin clawback). */
export async function onReversed(reservationId: string): Promise<void> {
  const s = await prisma.ambassadorSignup.findUnique({ where: { reservationId }, select: { state: true } });
  if (!s) return;
  await prisma.ambassadorSignup
    .update({ where: { reservationId }, data: { state: 'REVERTIDA', valid: false, rewardCents: 0 } })
    .catch(() => {});
}

/**
 * Resuelve un alta EN_REVISION. `approve=false` → REVERTIDA. `approve=true` →
 * si ya se pagó el total, pasa a EN_RETENCION y devenga (según modelo/estado del
 * embajador); si aún no se ha pagado, vuelve a RESERVADA para seguir el flujo
 * normal cuando pague.
 */
export async function resolveReview(signupId: string, approve: boolean): Promise<void> {
  const s = await prisma.ambassadorSignup.findUnique({
    where: { id: signupId },
    include: { ambassador: { select: { model: true, status: true, reactivateBy: true } } },
  });
  if (!s || s.state !== 'EN_REVISION') return;

  if (!approve) {
    await prisma.ambassadorSignup.update({ where: { id: signupId }, data: { state: 'REVERTIDA', valid: false, rewardCents: 0 } }).catch(() => {});
    return;
  }
  if (!s.fullPaidAt) {
    await prisma.ambassadorSignup.update({ where: { id: signupId }, data: { state: 'RESERVADA' } }).catch(() => {});
    return;
  }
  const cfg = await getAmbassadorConfig();
  const model: ModelKey = s.codeType === 'MEMBER' ? 'C' : ((s.ambassador?.model ?? 'A') as ModelKey);
  const { rewardCents } = splitReward(rewardForPlan(s.plan ?? 'PRIME', cfg), model);
  const lapsed = s.ambassador?.reactivateBy ? new Date(s.ambassador.reactivateBy).getTime() < Date.now() : false;
  const suspended = s.ambassador ? s.ambassador.status !== 'ACTIVO' : false;
  const earns = s.codeType === 'MEMBER' ? true : !lapsed && !suspended;
  const retentionUntil = new Date(s.fullPaidAt.getTime() + cfg.retentionDays * 86400000);
  await prisma.ambassadorSignup
    .update({ where: { id: signupId }, data: { state: 'EN_RETENCION', rewardCents: earns ? rewardCents : 0, retentionUntil } })
    .catch(() => {});
}

/**
 * Pasa a VALIDADA las altas cuya retención venció sin devolución ni flags.
 * Pensado para un job (día a día). Devuelve cuántas validó.
 */
export async function validateDueSignups(): Promise<number> {
  const r = await prisma.ambassadorSignup.updateMany({
    where: { state: 'EN_RETENCION', retentionUntil: { lte: new Date() } },
    data: { state: 'VALIDADA', valid: true },
  });
  return r.count;
}
