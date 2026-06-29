import type {
  CapturePaymentResult,
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentProvider,
  WebhookVerificationResult,
} from './types';

/**
 * Proveedor PayPal — ACTIVO desde inicio (doc 03).
 * La integración real (REST Orders v2 + verificación de webhook) se completa en Fase 1.
 * Aquí queda la estructura y el control de habilitación.
 */
export class PayPalProvider implements PaymentProvider {
  readonly key = 'PAYPAL' as const;

  isEnabled(): boolean {
    return process.env.PAYMENTS_PAYPAL_ENABLED === 'true';
  }

  async createPayment(_input: CreatePaymentInput): Promise<CreatePaymentResult> {
    throw new Error('PayPalProvider.createPayment se implementa en Fase 1 (checkout).');
  }

  async capturePayment(_providerRef: string): Promise<CapturePaymentResult> {
    throw new Error('PayPalProvider.capturePayment se implementa en Fase 1 (checkout).');
  }

  async verifyWebhook(
    _headers: Record<string, string>,
    _body: string,
  ): Promise<WebhookVerificationResult> {
    throw new Error('PayPalProvider.verifyWebhook se implementa en Fase 1 (webhooks).');
  }
}
