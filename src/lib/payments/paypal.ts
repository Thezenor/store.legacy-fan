import type {
  CapturePaymentResult,
  CreatePaymentInput,
  CreatePaymentResult,
  CreateSubscriptionInput,
  CreateSubscriptionResult,
  PaymentProvider,
  SubscriptionInfo,
  SubscriptionProvider,
  SubscriptionRemoteStatus,
  WebhookVerificationResult,
} from './types';
import { prisma } from '../prisma';

// Mapea el estado remoto de PayPal a nuestro estado de suscripción.
function mapPayPalSubStatus(s?: string): SubscriptionRemoteStatus {
  switch (s) {
    case 'ACTIVE':
      return 'ACTIVA';
    case 'SUSPENDED':
      return 'PAGO_FALLIDO';
    case 'CANCELLED':
      return 'CANCELADA';
    case 'EXPIRED':
      return 'CADUCADA';
    default:
      return 'PENDIENTE'; // APPROVAL_PENDING / APPROVED
  }
}

// Lee una credencial: BD (panel admin) con respaldo a variable de entorno.
async function cred(key: string, envName: string): Promise<string | undefined> {
  const row = await prisma.systemSetting.findUnique({ where: { key } });
  const dbVal = row?.value ? String(row.value) : '';
  return dbVal || process.env[envName];
}

// Lee una credencial por modo (sandbox/live): primero la clave específica del modo
// (paypal.sandbox.* / paypal.live.*), luego la clave heredada (paypal.*) y el entorno.
// Permite guardar AMBOS juegos de credenciales y alternar solo cambiando el modo.
async function credForMode(
  mode: 'sandbox' | 'live',
  field: string,
  envName: string,
): Promise<string | undefined> {
  const row = await prisma.systemSetting.findUnique({ where: { key: `paypal.${mode}.${field}` } });
  if (row?.value) return String(row.value);
  return cred(`paypal.${field}`, envName); // respaldo: clave heredada + variable de entorno
}

/**
 * Proveedor PayPal — ACTIVO desde inicio (doc 03). Integración REST Orders v2.
 * Modo sandbox/live según PAYPAL_MODE. Requiere PAYPAL_CLIENT_ID/SECRET y, para
 * webhooks, PAYPAL_WEBHOOK_ID. Sin credenciales, las llamadas fallan de forma
 * controlada (el flujo está implementado pero no probado hasta tener sandbox).
 */
export class PayPalProvider implements PaymentProvider, SubscriptionProvider {
  readonly key = 'PAYPAL' as const;

  private tokenCache: { token: string; expiresAt: number } | null = null;

  isEnabled(): boolean {
    return process.env.PAYMENTS_PAYPAL_ENABLED === 'true';
  }

  private async mode(): Promise<'sandbox' | 'live'> {
    const m = await cred('paypal.mode', 'PAYPAL_MODE');
    return m === 'live' ? 'live' : 'sandbox';
  }

  private async baseUrl(): Promise<string> {
    return (await this.mode()) === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';
  }

  private async credentials(): Promise<{ id: string; secret: string }> {
    const mode = await this.mode();
    const id = await credForMode(mode, 'client_id', 'PAYPAL_CLIENT_ID');
    const secret = await credForMode(mode, 'client_secret', 'PAYPAL_CLIENT_SECRET');
    if (!id || !secret) {
      throw new Error(
        `PayPal sin credenciales para modo "${mode}": configúralas en /lf-admin (Configuración) o en el entorno.`,
      );
    }
    return { id, secret };
  }

  private async accessToken(): Promise<string> {
    const now = Date.now();
    if (this.tokenCache && this.tokenCache.expiresAt > now + 30_000) {
      return this.tokenCache.token;
    }
    const { id, secret } = await this.credentials();
    const auth = Buffer.from(`${id}:${secret}`).toString('base64');
    const res = await fetch(`${await this.baseUrl()}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    if (!res.ok) throw new Error(`PayPal OAuth falló: HTTP ${res.status}`);
    const data = (await res.json()) as { access_token: string; expires_in: number };
    this.tokenCache = {
      token: data.access_token,
      expiresAt: now + data.expires_in * 1000,
    };
    return data.access_token;
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const token = await this.accessToken();
    const res = await fetch(`${await this.baseUrl()}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            custom_id: input.referenceId,
            description: input.description,
            amount: {
              currency_code: input.currency,
              value: (input.amountCents / 100).toFixed(2),
            },
          },
        ],
        application_context: {
          brand_name: 'Legacy Fan',
          user_action: 'PAY_NOW',
          return_url: input.returnUrl,
          cancel_url: input.cancelUrl,
        },
      }),
    });
    if (!res.ok) throw new Error(`PayPal create order falló: HTTP ${res.status}`);
    const data = (await res.json()) as {
      id: string;
      links: { rel: string; href: string }[];
    };
    const approveUrl = data.links.find((l) => l.rel === 'approve')?.href;
    return { providerRef: data.id, approveUrl };
  }

  async capturePayment(providerRef: string): Promise<CapturePaymentResult> {
    const token = await this.accessToken();
    const res = await fetch(`${await this.baseUrl()}/v2/checkout/orders/${providerRef}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const data = (await res.json()) as {
      status?: string;
      purchase_units?: {
        payments?: { captures?: { amount?: { currency_code?: string; value?: string } }[] };
      }[];
    };
    if (!res.ok) throw new Error(`PayPal capture falló: HTTP ${res.status}`);

    const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
    const value = capture?.amount?.value ?? '0';
    const currency = (capture?.amount?.currency_code ?? 'EUR') as 'EUR' | 'USD';
    return {
      providerRef,
      status: data.status === 'COMPLETED' ? 'COMPLETED' : data.status === 'PENDING' ? 'PENDING' : 'FAILED',
      amountCents: Math.round(parseFloat(value) * 100),
      currency,
      raw: data,
    };
  }

  async verifyWebhook(
    headers: Record<string, string>,
    body: string,
  ): Promise<WebhookVerificationResult> {
    const token = await this.accessToken();
    const webhookId = await credForMode(await this.mode(), 'webhook_id', 'PAYPAL_WEBHOOK_ID');
    if (!webhookId) throw new Error('Falta el Webhook ID de PayPal (config o entorno).');

    const event = JSON.parse(body) as { event_type?: string; resource?: { custom_id?: string } };
    const res = await fetch(`${await this.baseUrl()}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_algo: headers['paypal-auth-algo'],
        cert_url: headers['paypal-cert-url'],
        transmission_id: headers['paypal-transmission-id'],
        transmission_sig: headers['paypal-transmission-sig'],
        transmission_time: headers['paypal-transmission-time'],
        webhook_id: webhookId,
        webhook_event: event,
      }),
    });
    const data = (await res.json()) as { verification_status?: string };
    return {
      verified: data.verification_status === 'SUCCESS',
      eventType: event.event_type ?? 'UNKNOWN',
      providerRef: event.resource?.custom_id,
      raw: event,
    };
  }

  // ── Suscripciones (PayPal Subscriptions / Billing) ────────────────────────

  async createSubscription(input: CreateSubscriptionInput): Promise<CreateSubscriptionResult> {
    const token = await this.accessToken();
    const res = await fetch(`${await this.baseUrl()}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan_id: input.planId,
        custom_id: input.referenceId,
        application_context: {
          brand_name: 'Legacy Fan',
          user_action: 'SUBSCRIBE_NOW',
          return_url: input.returnUrl,
          cancel_url: input.cancelUrl,
        },
      }),
    });
    if (!res.ok) throw new Error(`PayPal create subscription falló: HTTP ${res.status}`);
    const data = (await res.json()) as { id: string; links?: { rel: string; href: string }[] };
    const approveUrl = data.links?.find((l) => l.rel === 'approve')?.href;
    return { providerSubscriptionId: data.id, approveUrl };
  }

  async getSubscription(providerSubscriptionId: string): Promise<SubscriptionInfo> {
    const token = await this.accessToken();
    const res = await fetch(
      `${await this.baseUrl()}/v1/billing/subscriptions/${providerSubscriptionId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) throw new Error(`PayPal get subscription falló: HTTP ${res.status}`);
    const data = (await res.json()) as {
      status?: string;
      billing_info?: { next_billing_time?: string };
    };
    const next = data.billing_info?.next_billing_time;
    return {
      status: mapPayPalSubStatus(data.status),
      currentPeriodEnd: next ? new Date(next) : undefined,
      raw: data,
    };
  }

  async cancelSubscription(providerSubscriptionId: string, reason = 'Cancelada por el socio'): Promise<void> {
    const token = await this.accessToken();
    const res = await fetch(
      `${await this.baseUrl()}/v1/billing/subscriptions/${providerSubscriptionId}/cancel`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      },
    );
    // 204 = cancelada; 422 si ya estaba cancelada → lo tratamos como idempotente.
    if (!res.ok && res.status !== 422) {
      throw new Error(`PayPal cancel subscription falló: HTTP ${res.status}`);
    }
  }
}
