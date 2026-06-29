import type { Prisma } from '@prisma/client';

/**
 * Activa la recompensa de referido cuando el referido completa el pago (doc 06):
 * "La recompensa solo se activa cuando el referido paga completo. No se activa con reserva."
 * Solo saldo interno. Modalidad de reparto según el código del referidor.
 *
 * `rewardCents` es el saldo total a repartir (configurable; MVP toma un % del premium).
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

  const mode = referral.referralCode.rewardMode;
  let referrerCents = 0;
  let referredCents = 0;
  if (mode === 'REFERRER_100') referrerCents = opts.rewardCents;
  else if (mode === 'REFERRED_100') referredCents = opts.rewardCents;
  else {
    referrerCents = Math.floor(opts.rewardCents / 2);
    referredCents = opts.rewardCents - referrerCents;
  }

  const credit = async (userId: string, cents: number, reason: string) => {
    if (cents <= 0) return;
    const wallet = await tx.pointsWallet.upsert({
      where: { userId },
      update: { balanceCents: { increment: cents } },
      create: { userId, balanceCents: cents, pendingCents: 0 },
    });
    await tx.pointsTransaction.create({
      data: { walletId: wallet.id, type: 'REFERRAL_REWARD', amountCents: cents, reason },
    });
  };

  await credit(referral.referrerId, referrerCents, 'Recompensa por referido (pago completo)');
  await credit(opts.referredUserId, referredCents, 'Bono de bienvenida por referido');

  await tx.referral.update({
    where: { id: referral.id },
    data: { status: 'PAGO_COMPLETO', rewardGrantedCents: opts.rewardCents },
  });

  return { referrerCents, referredCents };
}
