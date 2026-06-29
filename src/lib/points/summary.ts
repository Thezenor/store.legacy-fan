import { prisma } from '../prisma';

// Resumen de puntos/saldo para el panel (doc 06/08).
export async function getPointsSummary(userId: string) {
  const wallet = await prisma.pointsWallet.findUnique({
    where: { userId },
    include: {
      transactions: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });
  if (!wallet) return { balanceCents: 0, pendingCents: 0, transactions: [] };
  return {
    balanceCents: wallet.balanceCents,
    pendingCents: wallet.pendingCents,
    transactions: wallet.transactions,
  };
}
