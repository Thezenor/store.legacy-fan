import type {
  CapturePaymentResult,
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentProvider,
  WebhookVerificationResult,
} from './types';

/**
 * Proveedor Stripe — PREPARADO pero DESACTIVADO (doc 03/09).
 * Implementa el contrato para poder activarse en el futuro desde superadmin/env,
 * sin tocar el resto del checkout.
 */
export class StripeProvider implements PaymentProvider {
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
}
