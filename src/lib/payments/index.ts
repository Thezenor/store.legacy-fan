import type { PaymentProvider, SubscriptionProvider } from './types';
import { prisma } from '../prisma';
import { PayPalProvider } from './paypal';
import { StripeProvider } from './stripe';

export * from './types';

const paypal = new PayPalProvider();
const stripe = new StripeProvider();

// Ambos proveedores implementan pagos y suscripciones.
const registry: Record<string, PayPalProvider | StripeProvider> = {
  PAYPAL: paypal,
  STRIPE: stripe,
};

/** Devuelve los proveedores actualmente habilitados (PayPal de inicio). */
export function getEnabledPaymentProviders(): PaymentProvider[] {
  return Object.values(registry).filter((p) => p.isEnabled());
}

/** Obtiene un proveedor de pago por clave; lanza si está deshabilitado (env). */
export function getPaymentProvider(key: 'PAYPAL' | 'STRIPE'): PaymentProvider {
  const provider = registry[key];
  if (!provider || !provider.isEnabled()) {
    throw new Error(`La pasarela ${key} no está habilitada.`);
  }
  return provider;
}

/** Proveedor de pago SIN gating de env (el gate real son las credenciales). */
export function getPaymentProviderUnchecked(key: 'PAYPAL' | 'STRIPE'): PaymentProvider {
  const provider = registry[key];
  if (!provider) throw new Error(`Pasarela ${key} desconocida.`);
  return provider;
}

/** Prueba la conexión/credenciales del modo activo de una pasarela. */
export async function testGatewayConnection(
  key: 'PAYPAL' | 'STRIPE',
): Promise<{ ok: boolean; detail: string }> {
  const provider = registry[key];
  if (!provider) return { ok: false, detail: `Pasarela ${key} desconocida.` };
  return provider.verifyCredentials();
}

/**
 * ¿La pasarela está habilitada? El interruptor del PANEL (SystemSetting
 * `payments.{gw}.enabled`) manda; si no existe, cae a la variable de entorno
 * `PAYMENTS_{GW}_ENABLED`. Así el superadmin puede activarla sin tocar el entorno.
 */
export async function isGatewayEnabled(key: 'PAYPAL' | 'STRIPE'): Promise<boolean> {
  const row = await prisma.systemSetting.findUnique({
    where: { key: `payments.${key.toLowerCase()}.enabled` },
  });
  if (row && row.value !== null && typeof row.value !== 'undefined') return Boolean(row.value);
  return process.env[`PAYMENTS_${key}_ENABLED`] === 'true';
}

/** Obtiene un proveedor de SUSCRIPCIÓN por clave; lanza si está deshabilitado. */
export function getSubscriptionProvider(key: 'PAYPAL' | 'STRIPE'): SubscriptionProvider {
  const provider = registry[key];
  if (!provider || !provider.isEnabled()) {
    throw new Error(`La pasarela ${key} no está habilitada.`);
  }
  return provider;
}

/** Primera pasarela habilitada (para iniciar suscripciones con la activa). */
export function getActiveSubscriptionProvider(): SubscriptionProvider {
  const active = Object.values(registry).find((p) => p.isEnabled());
  if (!active) throw new Error('No hay ninguna pasarela habilitada.');
  return active;
}

/**
 * Proveedor de suscripción SIN comprobar isEnabled (operaciones de admin como
 * crear planes antes de activar la pasarela). El acceso real sigue gobernado por
 * la presencia de credenciales en el propio proveedor.
 */
export function getSubscriptionProviderForAdmin(key: 'PAYPAL' | 'STRIPE'): SubscriptionProvider {
  const provider = registry[key];
  if (!provider) throw new Error(`Pasarela ${key} desconocida.`);
  return provider;
}
