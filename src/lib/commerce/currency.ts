'use server';

import { cookies } from 'next/headers';
import { auth } from '../auth';
import { prisma } from '../prisma';
import type { Currency } from './money';

const COOKIE = 'lf-currency';

/**
 * Divisa de visualización (decisión D: selección manual, sin GEO).
 * Prioridad: cookie explícita → preferencia del perfil (si logueado) → EUR.
 */
export async function getDisplayCurrency(): Promise<Currency> {
  const store = await cookies();
  const fromCookie = store.get(COOKIE)?.value;
  if (fromCookie === 'EUR' || fromCookie === 'USD') return fromCookie;

  const session = await auth();
  if (session?.user?.id) {
    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
      select: { preferredCurrency: true },
    });
    if (profile?.preferredCurrency) return profile.preferredCurrency;
  }
  return 'EUR';
}

/** Server action: fija la divisa elegida en cookie (1 año). */
export async function setCurrencyAction(currency: Currency): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, currency, {
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
    sameSite: 'lax',
  });
}
