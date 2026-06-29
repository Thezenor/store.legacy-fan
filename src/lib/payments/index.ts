import type { PaymentProvider } from './types';
import { PayPalProvider } from './paypal';
import { StripeProvider } from './stripe';

export * from './types';

const paypal = new PayPalProvider();
const stripe = new StripeProvider();

const registry: Record<string, PaymentProvider> = {
  PAYPAL: paypal,
  STRIPE: stripe,
};

/** Devuelve los proveedores actualmente habilitados (PayPal de inicio). */
export function getEnabledPaymentProviders(): PaymentProvider[] {
  return Object.values(registry).filter((p) => p.isEnabled());
}

/** Obtiene un proveedor por clave; lanza si está deshabilitado. */
export function getPaymentProvider(key: 'PAYPAL' | 'STRIPE'): PaymentProvider {
  const provider = registry[key];
  if (!provider || !provider.isEnabled()) {
    throw new Error(`La pasarela ${key} no está habilitada.`);
  }
  return provider;
}
