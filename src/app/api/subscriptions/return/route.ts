import { NextResponse, type NextRequest } from 'next/server';
import { reconcileSubscriptionActivated } from '@/lib/subscriptions';

import { appUrl } from '@/lib/app-url';

function localizedPath(locale: string, path: string): string {
  const prefix = locale && locale !== 'es' ? `/${locale}` : '';
  return `${appUrl()}${prefix}${path}`;
}

// Retorno tras aprobar la suscripción en la pasarela. La activación real la
// confirma el webhook (fuente de verdad); aquí intentamos reconciliar ya para
// que el socio vea su estado al volver, y redirigimos a su cuenta.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') || 'es';
  const subId = searchParams.get('subscription_id'); // PayPal devuelve subscription_id

  if (subId) {
    try {
      await reconcileSubscriptionActivated(subId);
    } catch {
      /* no bloquear el retorno; el webhook reconciliará */
    }
  }
  return NextResponse.redirect(localizedPath(locale, '/account?subscribed=1'));
}
