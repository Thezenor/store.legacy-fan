import { NextResponse, type NextRequest } from 'next/server';

/**
 * Webhook de Stripe — PREPARADO pero DESACTIVADO (PAYMENTS_STRIPE_ENABLED).
 *
 * FAIL-CLOSED (auditoría 2026-07-02): mientras la verificación de firma no esté
 * implementada, este webhook NO procesa eventos aunque se active el flag — sin
 * firma, cualquiera podría forjar `invoice.paid` y activar membresías gratis.
 *
 * Para activarlo de verdad:
 *  1) Verificar la firma: stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET).
 *  2) Mapear eventos a las funciones de ciclo de vida (como PayPal):
 *     customer.subscription.created / checkout.session.completed → reconcileSubscriptionActivated(subId)
 *     invoice.paid → reconcileSubscriptionRenewed(subId, periodEnd)
 *     customer.subscription.deleted → reconcileSubscriptionCancelled(subId)
 *     invoice.payment_failed → reconcileSubscriptionSuspended(subId)
 *     (en '@/lib/subscriptions'; el id local se reconcilia por providerSubscriptionId)
 *  3) Sustituir el 501 por el procesado.
 */
export async function POST(_req: NextRequest) {
  if (process.env.PAYMENTS_STRIPE_ENABLED !== 'true') {
    return NextResponse.json({ ok: true, skipped: 'stripe_disabled' });
  }
  return NextResponse.json(
    { ok: false, error: 'signature_verification_not_implemented' },
    { status: 501 },
  );
}
