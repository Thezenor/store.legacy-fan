type ClubType = string;
import { getTranslations } from 'next-intl/server';
import { getClubPricing, getReservationTerms, type Currency } from '@/lib/commerce';

// Bloque de precio público: la RESERVA es lo principal; debajo, el pago completo
// con el PVP oficial tachado y el precio actual. Sin referencias a "Fases".
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
    <div className="mt-6 rounded-card border border-gold/40 bg-surface-elevated p-5">
      {/* Reserva: el foco principal */}
      <p className="eyebrow text-gold-light">{t('reserveFrom')}</p>
      <p className="mt-1 font-display text-4xl font-bold tabular-nums text-metal-gold sm:text-5xl">
        {reservation.amountFormatted}
      </p>
      <p className="mt-2 text-xs text-muted">{t('reservationNote')}</p>

      {/* Pago completo: secundario, con PVP tachado + precio actual */}
      <div className="mt-4 border-t border-border pt-3">
        <p className="text-xs uppercase tracking-wider text-faint">{t('fullPrice')}</p>
        <p className="mt-1 flex items-baseline gap-2">
          {pricing.listPriceFormatted ? (
            <span className="text-sm text-faint line-through">{pricing.listPriceFormatted}</span>
          ) : null}
          <span className="text-xl font-semibold tabular-nums text-foreground">
            {pricing.priceFormatted}
          </span>
        </p>
      </div>

      {pricing.freeShipping && pricing.freeShippingCountries.includes('ES') ? (
        <p className="mt-2 text-xs text-silver">✦ {t('freeShippingEs')}</p>
      ) : null}
    </div>
  );
}
