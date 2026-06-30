import { NextResponse, type NextRequest } from 'next/server';
import {
  reconcileSubscriptionActivated,
  reconcileSubscriptionRenewed,
  reconcileSubscriptionCancelled,
  reconcileSubscriptionSuspended,
} from '@/lib/subscriptions';

/**
 * Webhook de Stripe — PREPARADO pero DESACTIVADO (PAYMENTS_STRIPE_ENABLED).
 * Cuando se active, hay que:
 *  1) Verificar la firma con stripe.webhooks.constructEvent(body, sig, secret).
 *  2) Mapear los eventos a las mismas funciones de ciclo de vida que PayPal.
 * El id de suscripción local se reconcilia por providerSubscriptionId (= sub de Stripe).
 */
export async function POST(req: NextRequest) {
  if (process.env.PAYMENTS_STRIPE_ENABLED !== 'true') {
    return NextResponse.json({ ok: true, skipped: 'stripe_disabled' });
  }

  try {
    // TODO(stripe): verificar firma (Stripe-Signature) con el webhook secret.
    const event = (await req.json()) as {
      type?: string;
      data?: { object?: { id?: string; subscription?: string; current_period_end?: number } };
    };
    const obj = event.data?.object;
    const subId = obj?.subscription || obj?.id;
    const periodEnd = obj?.current_period_end ? new Date(obj.current_period_end * 1000) : undefined;

    switch (event.type) {
      case 'customer.subscription.created':
      case 'checkout.session.completed':
        if (subId) await reconcileSubscriptionActivated(subId);
        break;
      case 'invoice.paid':
        if (subId) await reconcileSubscriptionRenewed(subId, periodEnd);
        break;
      case 'customer.subscription.deleted':
        if (subId) await reconcileSubscriptionCancelled(subId);
        break;
      case 'invoice.payment_failed':
        if (subId) await reconcileSubscriptionSuspended(subId);
        break;
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
