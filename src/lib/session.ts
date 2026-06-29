import { auth } from './auth';
import { redirect } from '@/i18n/navigation';

// Helpers de sesión para Server Components / acciones.

export async function getSession() {
  return auth();
}

/** Devuelve la sesión o redirige a /login si no hay usuario. */
export async function requireUser(locale: string) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect({ href: '/login', locale });
  }
  return session!;
}

/** True si el email del usuario en sesión está verificado. */
export function isEmailVerified(session: { user?: { emailVerified?: Date | null } } | null) {
  return !!session?.user?.emailVerified;
}

/**
 * Gating de checkout (decisión D-009): exige usuario con email verificado.
 * Redirige a /login si no hay sesión, o a /verify-email si falta verificar.
 */
export async function requireVerifiedUser(locale: string) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect({ href: '/login', locale });
  }
  if (!isEmailVerified(session)) {
    redirect({ href: '/verify-email', locale });
  }
  return session!;
}
