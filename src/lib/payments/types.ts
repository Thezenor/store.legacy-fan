// Contrato común de pasarelas de pago. PayPal y Stripe lo implementan.
// La activación/desactivación se controla por SystemSetting / env (doc 03, 09).

export type Currency = 'EUR' | 'USD';

export interface CreatePaymentInput {
  amountCents: number;
  currency: Currency;
  description: string;
  /** Referencia interna (reservation/payment id) para reconciliación. */
  referenceId: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface CreatePaymentResult {
  /** Id de la orden/intención en el proveedor. */
  providerRef: string;
  /** URL a la que redirigir al usuario para aprobar el pago, si aplica. */
  approveUrl?: string;
}

export interface CapturePaymentResult {
  providerRef: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  amountCents: number;
  currency: Currency;
  raw: unknown;
}

export interface WebhookVerificationResult {
  verified: boolean;
  eventType: string;
  providerRef?: string;
  raw: unknown;
}

export interface PaymentProvider {
  readonly key: 'PAYPAL' | 'STRIPE';
  isEnabled(): boolean;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  capturePayment(providerRef: string): Promise<CapturePaymentResult>;
  verifyWebhook(headers: Record<string, string>, body: string): Promise<WebhookVerificationResult>;
}
