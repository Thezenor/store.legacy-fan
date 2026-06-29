import type { Currency, Prisma } from '@prisma/client';

/**
 * Genera puntos/saldo al completar un pago (doc 06): SOLO sobre el premium,
 * nunca sobre el spot del metal. En membresías el importe es íntegramente
 * premium (sin metal), por lo que la base es el precio pagado.
 *
 * Modelo MVP: `ratio` = puntos por unidad de divisa (EUR/USD) de premium.
 * 1 punto = 1 céntimo de saldo interno (equivalencia configurable a futuro).
 * Caducidad por defecto 2 años (configurable).
 */
export async function earnPointsOnPurchase(
  tx: Prisma.TransactionClient,
  opts: {
    userId: string;
    premiumCents: number;
    currency: Currency;
    ratio: number;
    expiryYears: number;
    reason?: string;
  },
) {
  const units = Math.floor(opts.premiumCents / 100); // unidades de divisa
  const earnedCents = units * opts.ratio; // puntos == céntimos de saldo (MVP)
  if (earnedCents <= 0) return null;

  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + opts.expiryYears);

  const wallet = await tx.pointsWallet.upsert({
    where: { userId: opts.userId },
    update: { balanceCents: { increment: earnedCents } },
    create: { userId: opts.userId, balanceCents: earnedCents, pendingCents: 0 },
  });

  await tx.pointsTransaction.create({
    data: {
      walletId: wallet.id,
      type: 'EARN',
      amountCents: earnedCents,
      reason: opts.reason ?? 'Compra: pago completo de membresía',
      expiresAt,
    },
  });

  return earnedCents;
}
