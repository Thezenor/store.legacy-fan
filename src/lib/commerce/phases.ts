import { cache } from 'react';
import type { MembershipPhase, MembershipPlan } from '@prisma/client';

// El club es un código libre (PRIME, PRESTIGE o nuevos creados en admin).
type ClubType = string;
import { prisma } from '../prisma';
import { getDate, getNumber } from './settings';
import { formatMoney, pickPrice, type Currency } from './money';

// Plan (club) con su configuración propia. Memoizado por request.
export const getPlan = cache(async (club: ClubType): Promise<MembershipPlan | null> => {
  return prisma.membershipPlan.findUnique({ where: { club } });
});

/** ¿El club está activo (visible en la web)? */
export async function isClubActive(club: ClubType): Promise<boolean> {
  const p = await getPlan(club);
  return !!p?.active;
}

/** Clubs activos, ordenados por club. */
export async function listActiveClubs(): Promise<MembershipPlan[]> {
  return prisma.membershipPlan.findMany({ where: { active: true }, orderBy: { club: 'asc' } });
}

/** Fecha de lanzamiento del club (propia) con respaldo a la global. */
export async function getClubLaunchDate(club: ClubType): Promise<Date | null> {
  const p = await getPlan(club);
  return p?.launchDate ?? (await getDate('launch.date'));
}

/**
 * Resolución de la fase activa de un club (doc 09):
 * "Las fases cambian automáticamente por fecha, pero el superadmin puede forzar estado."
 *
 * Prioridad:
 *  1) Fase con override forzado del admin (forcedState && isActive).
 *  2) Fase cuya ventana [startsAt, endsAt] contiene ahora.
 *  3) Fase marcada isActive=true.
 *  4) Primera fase por sortOrder (fallback).
 */
const loadPhases = cache(async (club: ClubType): Promise<MembershipPhase[]> => {
  return prisma.membershipPhase.findMany({
    where: { plan: { club } },
    orderBy: { sortOrder: 'asc' },
  });
});

function inWindow(phase: MembershipPhase, now: Date): boolean {
  const afterStart = !phase.startsAt || phase.startsAt.getTime() <= now.getTime();
  const beforeEnd = !phase.endsAt || phase.endsAt.getTime() >= now.getTime();
  return afterStart && beforeEnd;
}

export async function getActivePhase(club: ClubType, now: Date = new Date()): Promise<MembershipPhase | null> {
  const phases = await loadPhases(club);
  if (phases.length === 0) return null;

  const forced = phases.find((p) => p.forcedState && p.isActive);
  if (forced) return forced;

  const byDate = phases.find((p) => (p.startsAt || p.endsAt) && inWindow(p, now));
  if (byDate) return byDate;

  const active = phases.find((p) => p.isActive);
  return active ?? phases[0];
}

export interface ClubPricing {
  club: ClubType;
  phaseKey: string;
  phaseName: string;
  currency: Currency;
  priceCents: number;
  priceFormatted: string;
  /** PVP oficial (tachado) si está definido y es mayor que el precio actual. */
  listPriceCents: number | null;
  listPriceFormatted: string | null;
  freeShipping: boolean;
  freeShippingCountries: string[];
  promoText: string | null;
}

/** Precio público de un club en la fase activa, en la divisa indicada. */
export async function getClubPricing(
  club: ClubType,
  currency: Currency,
  locale?: string,
): Promise<ClubPricing | null> {
  const phase = await getActivePhase(club);
  if (!phase) return null;
  const priceCents = pickPrice(phase, currency);

  // PVP oficial del club (precio tachado), solo si supera el precio actual.
  const plan = await getPlan(club);
  const listRaw = currency === 'USD' ? plan?.listPriceUsdCents ?? null : plan?.listPriceEurCents ?? null;
  const listPriceCents = listRaw != null && listRaw > priceCents ? listRaw : null;

  return {
    club,
    phaseKey: phase.key,
    phaseName: phase.name,
    currency,
    priceCents,
    priceFormatted: formatMoney(priceCents, currency, locale),
    listPriceCents,
    listPriceFormatted: listPriceCents != null ? formatMoney(listPriceCents, currency, locale) : null,
    freeShipping: phase.freeShipping,
    freeShippingCountries: phase.freeShippingCountries,
    promoText: phase.promoText,
  };
}

export interface ReservationTerms {
  amountCents: number;
  amountFormatted: string;
  launchDate: Date | null;
  /** Fecha límite de la reserva: lanzamiento + días de gracia. */
  expiresAt: Date | null;
  /** Reembolsable hasta: lanzamiento - horas configuradas. */
  refundableUntil: Date | null;
}

/** Términos de la reserva (50 €/$ por defecto) y ventanas de caducidad/reembolso (doc 03). */
export async function getReservationTerms(
  currency: Currency,
  locale?: string,
  club?: ClubType,
): Promise<ReservationTerms> {
  // Importe de reserva propio del club si está definido; si no, el global.
  let amountCents: number | null = null;
  let launchDate: Date | null;
  if (club) {
    const plan = await getPlan(club);
    amountCents = currency === 'USD' ? plan?.reservationUsdCents ?? null : plan?.reservationEurCents ?? null;
    launchDate = plan?.launchDate ?? (await getDate('launch.date'));
  } else {
    launchDate = await getDate('launch.date');
  }
  if (amountCents == null) {
    amountCents = await getNumber(currency === 'USD' ? 'reservation.amount.usd' : 'reservation.amount.eur');
  }
  const graceDays = await getNumber('reservation.grace_days_after_launch');
  const refundableHours = await getNumber('reservation.refundable_hours_before_launch');

  let expiresAt: Date | null = null;
  let refundableUntil: Date | null = null;
  if (launchDate) {
    expiresAt = new Date(launchDate.getTime() + graceDays * 24 * 60 * 60 * 1000);
    refundableUntil = new Date(launchDate.getTime() - refundableHours * 60 * 60 * 1000);
  }

  return {
    amountCents,
    amountFormatted: formatMoney(amountCents, currency, locale),
    launchDate,
    expiresAt,
    refundableUntil,
  };
}
