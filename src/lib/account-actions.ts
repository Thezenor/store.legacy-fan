'use server';

import { revalidatePath } from 'next/cache';
import { auth } from './auth';
import { cancelSubscription } from './subscriptions';

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
