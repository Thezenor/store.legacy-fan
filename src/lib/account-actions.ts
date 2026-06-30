'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { auth } from './auth';
import { cancelSubscription } from './subscriptions';

export type PasswordChangeResult = { ok: true } | { ok: false; code: string };

// El propio usuario cambia su contraseña (verifica la actual).
export async function changeOwnPasswordAction(
  _prev: PasswordChangeResult | null,
  formData: FormData,
): Promise<PasswordChangeResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, code: 'unauthenticated' };
  const current = String(formData.get('current') ?? '');
  const next = String(formData.get('next') ?? '');
  const confirm = String(formData.get('confirm') ?? '');

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.passwordHash || !(await bcrypt.compare(current, user.passwordHash))) {
    return { ok: false, code: 'invalid_current' };
  }
  if (next.length < 8 || !/[a-z]/.test(next) || !/[A-Z]/.test(next) || !/[0-9]/.test(next)) {
    return { ok: false, code: 'weak' };
  }
  if (next !== confirm) return { ok: false, code: 'mismatch' };

  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(next, 12) } });
  return { ok: true };
}

// El propio usuario edita sus datos de perfil (no requiere admin).
export async function updateOwnProfileAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  const s = (k: string) => String(formData.get(k) ?? '').trim();
  const firstName = s('firstName');
  const lastName = s('lastName');
  const country = (s('country') || 'ES').toUpperCase().slice(0, 2);
  const currency = s('currency') === 'USD' ? 'USD' : 'EUR';
  await prisma.userProfile.update({
    where: { userId: session.user.id },
    data: {
      ...(firstName ? { firstName } : {}),
      ...(lastName ? { lastName } : {}),
      phone: s('phone') || null,
      country,
      preferredCurrency: currency,
    },
  });
  const locale = s('locale') || 'es';
  const base = locale === 'es' ? '/account' : `/${locale}/account`;
  revalidatePath('/[locale]/account', 'page');
  redirect(`${base}?saved=profile#perfil`);
}

// Acción del propio socio: cancela su renovación automática (suscripción).
export async function cancelOwnSubscriptionAction(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  try {
    await cancelSubscription(session.user.id, 'Cancelada por el socio');
  } catch {
    /* si la pasarela falla, la marca local queda; reintentar luego */
  }
  revalidatePath('/[locale]/account', 'page');
}
