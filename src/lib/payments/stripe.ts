import type {
  CapturePaymentResult,
  CreatePaymentInput,
  CreatePaymentResult,
  CreateSubscriptionInput,
  CreateSubscriptionResult,
  PaymentProvider,
  SubscriptionInfo,
  SubscriptionProvider,
  WebhookVerificationResult,
} from './types';

/**
 * Proveedor Stripe — PREPARADO pero DESACTIVADO (doc 03/09).
 * Implementa el contrato (pagos y suscripciones) para poder activarse en el
 * futuro desde superadmin/env sin tocar el resto del checkout. Cuando se active:
 * - Pagos únicos: PaymentIntents / Checkout Session (mode=payment).
 * - Suscripciones: Prices recurrentes + Checkout Session (mode=subscription),
 *   y webhooks customer.subscription.* / invoice.paid.
 */
export class StripeProvider implements PaymentProvider, SubscriptionProvider {
  readonly key = 'STRIPE' as const;

  isEnabled(): boolean {
    return process.env.PAYMENTS_STRIPE_ENABLED === 'true';
  }

  async createPayment(_input: CreatePaymentInput): Promise<CreatePaymentResult> {
    throw new Error('Stripe está desactivado. Actívalo desde superadmin/env cuando proceda.');
  }

  async capturePayment(_providerRef: string): Promise<CapturePaymentResult> {
    throw new Error('Stripe está desactivado.');
  }

  async verifyWebhook(
    _headers: Record<string, string>,
    _body: string,
  ): Promise<WebhookVerificationResult> {
    throw new Error('Stripe está desactivado.');
  }

  // ── Suscripciones (Stripe Billing) — preparado, desactivado ───────────────

  async createSubscription(_input: CreateSubscriptionInput): Promise<CreateSubscriptionResult> {
    throw new Error('Stripe (suscripciones) está desactivado. Actívalo cuando proceda.');
  }

  async getSubscription(_providerSubscriptionId: string): Promise<SubscriptionInfo> {
    throw new Error('Stripe (suscripciones) está desactivado.');
  }

  async cancelSubscription(_providerSubscriptionId: string, _reason?: string): Promise<void> {
    throw new Error('Stripe (suscripciones) está desactivado.');
  }
}
