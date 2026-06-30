'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from './prisma';
import { auth } from './auth';
import { cancelSubscription } from './subscriptions';

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
