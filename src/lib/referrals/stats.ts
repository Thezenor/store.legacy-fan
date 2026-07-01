import { prisma } from '../prisma';

import { appUrl } from '../app-url';

// Resumen de referidos para el panel (doc 06/08).
export async function getReferralSummary(userId: string) {
  const code = await prisma.referralCode.findUnique({ where: { userId } });
  if (!code) return null;

  const referrals = await prisma.referral.findMany({
    where: { referrerId: userId },
    select: { status: true, rewardGrantedCents: true },
  });

  const registered = referrals.length;
  const paid = referrals.filter((r) => r.status === 'PAGO_COMPLETO').length;
  const generatedCents = referrals.reduce((sum, r) => sum + r.rewardGrantedCents, 0);

  return {
    code: code.code,
    customized: code.customized,
    rewardMode: code.rewardMode,
    link: `${appUrl()}/register?ref=${code.code}`,
    registered,
    paid,
    conversion: registered > 0 ? Math.round((paid / registered) * 100) : 0,
    generatedCents,
  };
}
