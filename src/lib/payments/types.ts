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

export interface ShippingAddress {
  name?: string;
  line1?: string;
  line2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
}

export interface CapturePaymentResult {
  providerRef: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  amountCents: number;
  currency: Currency;
  /** Dirección de envío facilitada por la pasarela, si la hay. */
  shipping?: ShippingAddress;
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

// ── Suscripciones recurrentes (renovación anual) ────────────────────────────
// Modelo agnóstico de pasarela. PayPal usa Billing Plans/Subscriptions; Stripe
// usa Prices/Subscriptions. El "planId" es el id del plan/precio creado en la
// pasarela (se configura desde el superadmin por modo y club).

export interface CreateSubscriptionInput {
  /** Id del plan (PayPal Billing Plan) o precio (Stripe Price) en la pasarela. */
  planId: string;
  /** Referencia interna (userId) para reconciliar el webhook. */
  referenceId: string;
  /** Importe por ciclo (para registro local; el cobro lo fija el plan). */
  amountCents: number;
  currency: Currency;
  returnUrl: string;
  cancelUrl: string;
}

export interface CreateSubscriptionResult {
  providerSubscriptionId: string;
  /** URL a la que redirigir al usuario para aprobar la suscripción. */
  approveUrl?: string;
}

export type SubscriptionRemoteStatus =
  | 'PENDIENTE'
  | 'ACTIVA'
  | 'EN_PRUEBA'
  | 'PAGO_FALLIDO'
  | 'CANCELADA'
  | 'CADUCADA';

export interface SubscriptionInfo {
  status: SubscriptionRemoteStatus;
  currentPeriodEnd?: Date;
  raw: unknown;
}

/** Datos para crear un plan/precio recurrente en la pasarela desde el admin. */
export interface CreatePlanInput {
  club: string;
  /** Nombre visible del plan (p. ej. "Legacy Prime Club — Anual"). */
  name: string;
  currency: Currency;
  /** Importe por ciclo en céntimos. */
  amountCents: number;
  /** Periodicidad en meses (12 = anual). */
  intervalMonths: number;
}

/** Capacidad de suscripción recurrente. La implementan PayPal y Stripe. */
export interface SubscriptionProvider {
  readonly key: 'PAYPAL' | 'STRIPE';
  isEnabled(): boolean;
  /** Crea el plan/precio en la pasarela y devuelve su id (P-XXXX en PayPal). */
  createSubscriptionPlan(input: CreatePlanInput): Promise<{ planId: string }>;
  createSubscription(input: CreateSubscriptionInput): Promise<CreateSubscriptionResult>;
  getSubscription(providerSubscriptionId: string): Promise<SubscriptionInfo>;
  cancelSubscription(providerSubscriptionId: string, reason?: string): Promise<void>;
}
