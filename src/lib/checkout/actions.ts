'use server';

type ClubType = string;
import { auth } from '../auth';
import { getDisplayCurrency } from '../commerce/currency';
import { startReservation, hasActiveReservationOrMembership } from './reservation';
import { startFullPayment } from './full-payment';

export type StartReservationActionResult =
  | { ok: true; approveUrl: string }
  | { ok: false; code: 'unauthenticated' | 'unverified' | 'already_active' | 'error' };

/**
 * Inicia la reserva (50 €/$) y devuelve la URL de aprobación de PayPal.
 * Gating D-009: requiere usuario con email verificado.
 */
export async function startReservationAction(
  club: ClubType | null,
  locale: string,
): Promise<StartReservationActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, code: 'unauthenticated' };
  if (!session.user.emailVerified) return { ok: false, code: 'unverified' };

  if (await hasActiveReservationOrMembership(session.user.id)) {
    return { ok: false, code: 'already_active' };
  }

  try {
    const currency = await getDisplayCurrency();
    const { approveUrl } = await startReservation({
      userId: session.user.id,
      club,
      currency,
      locale,
    });
    return { ok: true, approveUrl };
  } catch {
    return { ok: false, code: 'error' };
  }
}

export type FullPaymentActionResult =
  | { ok: true; approveUrl: string }
  | { ok: false; code: 'unauthenticated' | 'unverified' | 'already_member' | 'error' };

/**
 * Inicia el pago completo de un club (descuenta la reserva si existe) y devuelve
 * la URL de aprobación de PayPal. Gating D-009.
 */
export async function startFullPaymentAction(
  club: ClubType,
  locale: string,
): Promise<FullPaymentActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, code: 'unauthenticated' };
  if (!session.user.emailVerified) return { ok: false, code: 'unverified' };

  try {
    const currency = await getDisplayCurrency();
    const { approveUrl } = await startFullPayment({
      userId: session.user.id,
      club,
      currency,
      locale,
    });
    return { ok: true, approveUrl };
  } catch (e) {
    if (e instanceof Error && e.message === 'already_member') {
      return { ok: false, code: 'already_member' };
    }
    return { ok: false, code: 'error' };
  }
}
