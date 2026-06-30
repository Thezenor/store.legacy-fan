type ClubType = string;
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
    getReservationTerms(currency, locale, club),
    getTranslations({ locale, namespace: 'pricing' }),
  ]);

  if (!pricing) return null;

  return (
    <div className="mt-6 rounded-card border border-border bg-surface-elevated p-5">
      <p className="eyebrow">
        {t('currentPhase')} · {pricing.phaseName}
      </p>
      <p className="mt-2 flex items-baseline gap-2">
        <span className="text-xs uppercase tracking-wider text-muted">{t('from')}</span>
        <span className="text-3xl font-semibold tabular-nums text-foreground sm:text-4xl">
          {pricing.priceFormatted}
        </span>
      </p>
      <p className="mt-3 text-sm text-foreground">
        {t('reservation')}: <span className="serial">{reservation.amountFormatted}</span>
      </p>
      <p className="mt-1 text-xs text-muted">{t('reservationNote')}</p>
      {pricing.freeShipping && pricing.freeShippingCountries.includes('ES') ? (
        <p className="mt-2 text-xs text-silver">✦ {t('freeShippingEs')}</p>
      ) : null}
    </div>
  );
}
