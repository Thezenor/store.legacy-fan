import type { ClubType, Currency, Prisma } from '@prisma/client';

/**
 * Crea el pedido interno con los productos incluidos del club (doc 03/05):
 * "Crea pedido interno con productos incluidos" al completar el pago.
 * Los productos incluidos se generan como OrderItems con precio 0 y estado
 * pendiente de lanzamiento. Si aún no hay productos marcados, el pedido queda vacío.
 */
export async function createIncludedOrder(
  tx: Prisma.TransactionClient,
  opts: { userId: string; club: ClubType; currency: Currency; reservationId?: string | null },
) {
  const includedFilter =
    opts.club === 'PRIME' ? { includedInPrime: true } : { includedInPrestige: true };

  const products = await tx.product.findMany({
    where: { ...includedFilter, visible: true },
    select: { id: true, name: true, priceEurCents: true, priceUsdCents: true, logisticStatus: true },
  });

  const order = await tx.order.create({
    data: {
      userId: opts.userId,
      reservationId: opts.reservationId ?? null,
      currency: opts.currency,
      totalCents: 0, // incluidos en la membresía
      items: {
        create: products.map((p) => ({
          productId: p.id,
          name: p.name,
          status: p.logisticStatus,
          quantity: 1,
          unitPriceCents: 0,
        })),
      },
    },
    include: { items: true },
  });

  return order;
}
