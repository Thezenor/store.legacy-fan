import type { Prisma } from '@prisma/client';
type ClubType = string;
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

/**
 * Asigna el número de socio YA en la reserva (nuevo modelo: el depósito de 50
 * €/$ reserva el número). Crea la membresía en estado RESERVA_PENDIENTE si no
 * existe y le asigna número. Idempotente: si ya tiene número, lo conserva; no
 * degrada una membresía ya activa. El club es provisional (se fija en el pago
 * completo); si la reserva es genérica se usa PRIME como marcador.
 */
export async function reserveMembershipTx(
  tx: Prisma.TransactionClient,
  userId: string,
  club: ClubType | null,
) {
  const existing = await tx.membership.findUnique({ where: { userId } });
  const membership =
    existing ??
    (await tx.membership.create({
      data: { userId, club: club ?? 'PRIME', status: 'RESERVA_PENDIENTE' },
    }));

  const number = await assignMemberNumber(tx, membership.id);

  await tx.auditLog.create({
    data: {
      actorId: userId,
      action: 'membership.reserved',
      entity: 'Membership',
      entityId: membership.id,
      newValue: { memberNumber: number.formatted, club: membership.club },
    },
  });

  return { membership, number };
}

/**
 * Renueva la membresía un ciclo más (suscripción anual). Extiende endsAt (al
 * periodo de la pasarela si se conoce, o +1 año) CONSERVANDO el número de socio
 * y la fecha de alta. Reactiva si estaba caducada/suspendida. Idempotente por
 * periodo: no acorta una fecha de fin ya mayor. No reasigna número.
 */
export async function renewMembershipTx(
  tx: Prisma.TransactionClient,
  userId: string,
  periodEnd?: Date | null,
) {
  const existing = await tx.membership.findUnique({ where: { userId } });
  if (!existing) return null; // sin alta previa no hay nada que renovar

  const now = new Date();
  const floor = existing.endsAt && existing.endsAt.getTime() > now.getTime() ? existing.endsAt : now;
  // Si la pasarela informa fin de periodo, es autoritativo (idempotente ante
  // reentregas del webhook); si no, sumamos un año. Nunca acortamos.
  let newEnd: Date;
  if (periodEnd) {
    newEnd = periodEnd.getTime() > floor.getTime() ? periodEnd : floor;
  } else {
    newEnd = addYears(floor, 1);
  }

  const membership = await tx.membership.update({
    where: { userId },
    data: { status: 'SOCIO_ACTIVO', endsAt: newEnd },
  });

  await tx.auditLog.create({
    data: {
      actorId: userId,
      action: 'membership.renewed',
      entity: 'Membership',
      entityId: membership.id,
      newValue: { endsAt: newEnd.toISOString() },
    },
  });

  return membership;
}

/** Activa la membresía en su propia transacción (uso directo / admin). */
export async function activateMembership(userId: string, club: ClubType) {
  const launchDate = await getDate('launch.date');
  return prisma.$transaction((tx) => activateMembershipTx(tx, userId, club, launchDate), {
    maxWait: 10000,
    timeout: 20000,
  });
}
