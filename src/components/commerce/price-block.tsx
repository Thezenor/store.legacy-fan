import type { ClubType } from '@prisma/client';
import { getTranslations } from 'next-intl/server';
import { getClubPricing, getReservationTerms, type Currency } from '@/lib/commerce';

// Bloque de precio público: precio de la fase activa + reserva. Lee del motor comercial.
export async function PriceBlock({
  club,
  currency,
  locale,
}: {
  club: ClubType;
  currency: Currency;
  locale: string;
}) {
  const [pricing, reservation, t] = await Promise.all([
    getClubPricing(club, currency, locale),
    getReservationTerms(currency, locale),
    getTranslations({ locale, namespace: 'pricing' }),
  ]);

  if (!pricing) return null;

  return (
    <div className="mt-6 rounded-card border border-border bg-surface-elevated p-5">
      <p className="text-xs uppercase tracking-wide text-muted">
        {t('currentPhase')}: {pricing.phaseName}
      </p>
      <p className="mt-1">
        <span className="text-sm text-muted">{t('from')} </span>
        <span className="font-display text-3xl font-bold text-metal-gold">
          {pricing.priceFormatted}
        </span>
      </p>
      <p className="mt-3 text-sm text-foreground">
        {t('reservation')}: <span className="font-semibold">{reservation.amountFormatted}</span>
      </p>
      <p className="mt-1 text-xs text-muted">{t('reservationNote')}</p>
      {pricing.freeShipping && pricing.freeShippingCountries.includes('ES') ? (
        <p className="mt-2 text-xs text-silver">★ {t('freeShippingEs')}</p>
      ) : null}
    </div>
  );
}
