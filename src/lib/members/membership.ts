import type { ClubType } from '@prisma/client';
import { prisma } from '../prisma';
import { getDate } from '../commerce/settings';
import { assignMemberNumber } from './numbering';

// Duración de membresía (doc 02): 12 meses desde el lanzamiento (preventa) o
// desde el pago completo si es posterior. Configurable vía settings en el futuro.
function addYears(date: Date, years: number): Date {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

/**
 * Activa la membresía de un usuario y le asigna número de socio, de forma
 * atómica. Idempotente: si ya es socio, conserva fechas y número (útil en
 * upgrade Prime→Prestige, que solo cambia el club). Lo usa el pago completo (M6).
 */
export async function activateMembership(userId: string, club: ClubType) {
  const launchDate = await getDate('launch.date');
  const now = new Date();
  const start = launchDate && launchDate.getTime() > now.getTime() ? launchDate : now;
  const end = addYears(start, 1);

  return prisma.$transaction(async (tx) => {
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
    // Márgenes amplios: el advisory lock serializa la sección crítica y la
    // latencia hacia Railway puede acercarse al maxWait por defecto (2s).
  }, { maxWait: 10000, timeout: 20000 });
}
