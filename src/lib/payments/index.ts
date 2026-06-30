import type { PaymentProvider, SubscriptionProvider } from './types';
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

/** Obtiene un proveedor de pago por clave; lanza si está deshabilitado. */
export function getPaymentProvider(key: 'PAYPAL' | 'STRIPE'): PaymentProvider {
  const provider = registry[key];
  if (!provider || !provider.isEnabled()) {
    throw new Error(`La pasarela ${key} no está habilitada.`);
  }
  return provider;
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
