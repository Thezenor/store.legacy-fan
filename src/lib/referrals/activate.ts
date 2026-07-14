import type { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { getAmbassadorConfig, rewardForPlan } from '../ambassador/config';

/**
 * Recompensa de referido de SOCIO (Bases VER 5, alineado a 50/50):
 *  - El SOCIO que refiere recibe el 50% del valor del alta (7,50 Prime / 15
 *    Prestige) como CRÉDITO en tienda.
 *  - El AMIGO recibe el otro 50% como DESCUENTO en el pago final (ver
 *    referralDiscountForFullPayment; no se abona aquí como crédito).
 * Solo al PAGO TOTAL del amigo (la reserva no activa). Idempotente.
 * `rewardCents` es el valor TOTAL del alta (15/30); aquí se abona la mitad al socio.
 */
export async function activateReferralReward(
  tx: Prisma.TransactionClient,
  opts: { referredUserId: string; rewardCents: number },
) {
  const referral = await tx.referral.findUnique({
    where: { referredUserId: opts.referredUserId },
    include: { referralCode: true },
  });
  if (!referral || referral.status === 'PAGO_COMPLETO') return null; // sin referido o ya activado

  const referrerCents = Math.round(opts.rewardCents / 2); // 50% al socio en crédito
  if (referrerCents > 0) {
    const wallet = await tx.pointsWallet.upsert({
      where: { userId: referral.referrerId },
      update: { balanceCents: { increment: referrerCents } },
      create: { userId: referral.referrerId, balanceCents: referrerCents, pendingCents: 0 },
    });
    await tx.pointsTransaction.create({
      data: { walletId: wallet.id, type: 'REFERRAL_REWARD', amountCents: referrerCents, reason: 'Recompensa por referido (50%, pago completo)' },
    });
  }

  await tx.referral.update({
    where: { id: referral.id },
    data: { status: 'PAGO_COMPLETO', rewardGrantedCents: referrerCents },
  });

  return { referrerCents };
}

/**
 * Descuento (céntimos) que recibe el AMIGO referido en su PAGO FINAL: el 50% del
 * valor del alta (7,50 Prime / 15 Prestige). Independiente del programa de
 * embajadores (el referido de socio es permanente). 0 si no fue referido o su
 * alta ya se completó. Nunca toca el depósito de la reserva.
 */
export async function referralDiscountForFullPayment(referredUserId: string, plan: string): Promise<number> {
  const referral = await prisma.referral.findUnique({
    where: { referredUserId },
    select: { status: true },
  });
  if (!referral || referral.status === 'PAGO_COMPLETO') return 0;
  const cfg = await getAmbassadorConfig();
  return Math.round(rewardForPlan(plan, cfg) / 2);
}
