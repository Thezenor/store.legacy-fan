import type { ClubType, Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { getDate } from '../commerce/settings';
import { assignMemberNumber } from './numbering';
import { ensureReferralCode } from '../referrals/code';

// Duración de membresía (doc 02): 12 meses desde el lanzamiento (preventa) o
// desde el pago completo si es posterior. Configurable vía settings en el futuro.
function addYears(date: Date, years: number): Date {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

/**
 * Núcleo de activación DENTRO de una transacción dada (la usa el pago completo,
 * M6, para no anidar transacciones). Idempotente: conserva fechas y número si ya
 * es socio (upgrade Prime→Prestige solo cambia el club).
 */
export async function activateMembershipTx(
  tx: Prisma.TransactionClient,
  userId: string,
  club: ClubType,
  launchDate: Date | null,
) {
  const now = new Date();
  const start = launchDate && launchDate.getTime() > now.getTime() ? launchDate : now;
  const end = addYears(start, 1);

  const existing = await tx.membership.findUnique({ where: { userId } });
  const membership = existing
    ? await tx.membership.update({
        where: { userId },
        data: {
          club,
          status: 'SOCIO_ACTIVO',
          startsAt: existing.startsAt ?? start,
          endsAt: existing.endsAt ?? end,
          launchDate,
        },
      })
    : await tx.membership.create({
        data: { userId, club, status: 'SOCIO_ACTIVO', startsAt: start, endsAt: end, launchDate },
      });

  const number = await assignMemberNumber(tx, membership.id);

  // Cada socio dispone de su código de referido (doc 06)
  await ensureReferralCode(tx, userId);

  await tx.auditLog.create({
    data: {
      actorId: userId,
      action: existing ? 'membership.upgraded' : 'membership.activated',
      entity: 'Membership',
      entityId: membership.id,
      newValue: { club, memberNumber: number.formatted },
    },
  });

  return { membership, number };
}

/** Activa la membresía en su propia transacción (uso directo / admin). */
export async function activateMembership(userId: string, club: ClubType) {
  const launchDate = await getDate('launch.date');
  return prisma.$transaction((tx) => activateMembershipTx(tx, userId, club, launchDate), {
    maxWait: 10000,
    timeout: 20000,
  });
}
