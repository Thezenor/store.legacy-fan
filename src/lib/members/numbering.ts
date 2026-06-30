import type { Prisma, MemberNumber } from '@prisma/client';

// Numeración de socios (doc 04 / decisión usuario):
//  - Numeración global única, formato LF-000051+.
//  - 1–50 reservados a asignación manual del superadmin (pre-sembrados).
//  - La numeración automática empieza en 51 (51–100 liberados).
//  - Solo el pago completo asigna número; la reserva no.
//  - En upgrade Prime→Prestige se conserva el número.

export const AUTO_START = 51;
// Clave de advisory lock para serializar la generación de números (evita carreras).
const LOCK_KEY = 919283;

/** Formatea un entero a LF-000000. */
export function formatMemberNumber(n: number): string {
  return `LF-${String(n).padStart(6, '0')}`;
}

/**
 * Calcula y reserva el siguiente número libre ≥ 101 DENTRO de una transacción.
 * Toma un advisory lock de transacción para que dos pagos simultáneos no
 * obtengan el mismo número. Devuelve el número entero (sin crear la fila aún).
 */
async function nextFreeNumber(tx: Prisma.TransactionClient): Promise<number> {
  // Serializa esta sección crítica entre transacciones concurrentes.
  await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${LOCK_KEY})`);
  // Primer hueco libre ≥ AUTO_START (usa 51–100 antes de seguir subiendo).
  const taken = await tx.memberNumber.findMany({
    where: { number: { gte: AUTO_START } },
    orderBy: { number: 'asc' },
    select: { number: true },
  });
  let n = AUTO_START;
  for (const row of taken) {
    if (row.number === n) n += 1;
    else if (row.number > n) break; // hueco encontrado
  }
  return n;
}

/**
 * Asigna un número de socio a una membresía de forma atómica e idempotente.
 * - Si la membresía ya tiene número (p.ej. upgrade), lo devuelve sin cambios.
 * - Si no, crea la fila MemberNumber ≥ 101 y la enlaza.
 * Debe llamarse dentro de una transacción (la del pago completo).
 */
export async function assignMemberNumber(
  tx: Prisma.TransactionClient,
  membershipId: string,
): Promise<MemberNumber> {
  const existing = await tx.memberNumber.findUnique({ where: { membershipId } });
  if (existing) return existing; // upgrade / reintento: conserva su número

  const number = await nextFreeNumber(tx);
  return tx.memberNumber.create({
    data: {
      number,
      formatted: formatMemberNumber(number),
      membershipId,
      assignedAt: new Date(),
    },
  });
}
