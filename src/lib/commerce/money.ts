// Utilidades de dinero. Todos los importes se almacenan en céntimos (Int).
// Los descuentos/puntos se aplican SOLO sobre premium (regla doc 02/06/15),
// nunca sobre el spot del metal: esa lógica vive en los módulos de checkout/puntos.

export type Currency = 'EUR' | 'USD';

const LOCALE_BY_CURRENCY: Record<Currency, string> = {
  EUR: 'es-ES',
  USD: 'en-US',
};

/** Formatea céntimos a divisa legible. `locale` opcional para i18n. */
export function formatMoney(cents: number, currency: Currency, locale?: string): string {
  return new Intl.NumberFormat(locale ?? LOCALE_BY_CURRENCY[currency], {
    style: 'currency',
    currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

/** Selecciona el campo de precio correcto (eur/usd) de una entidad con ambos. */
export function pickPrice<T extends { priceEurCents: number; priceUsdCents: number }>(
  entity: T,
  currency: Currency,
): number {
  return currency === 'USD' ? entity.priceUsdCents : entity.priceEurCents;
}
