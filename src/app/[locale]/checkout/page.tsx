import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ClubType } from '@prisma/client';
import { requireVerifiedUser } from '@/lib/session';
import { getClubPricing, getReservationTerms } from '@/lib/commerce';
import { getDisplayCurrency } from '@/lib/commerce/currency';
import { hasActiveReservationOrMembership } from '@/lib/checkout/reservation';
import { ReserveButton } from '@/components/checkout/reserve-button';
import { Link } from '@/i18n/navigation';

/**
 * Stub de checkout (Módulo 3). Demuestra el gating de compra (M1: requiere
 * usuario con email verificado) y el resumen de precio (M2). El flujo real de
 * pago (reserva / pago completo con PayPal) se implementa en los Módulos 4 y 6.
 */
export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ club?: string; type?: string }>;
}) {
  const { locale } = await params;
  const { club, type } = await searchParams;
  setRequestLocale(locale);

  if ((club !== 'PRIME' && club !== 'PRESTIGE') || (type !== 'reserve' && type !== 'join')) {
    notFound();
  }

  // Gating de compra (D-009): sin sesión → /login; sin verificar → /verify-email.
  const session = await requireVerifiedUser(locale);

  const currency = await getDisplayCurrency();
  const t = await getTranslations({ locale, namespace: 'checkout' });
  const clubKey = club as ClubType;
  const pricing = await getClubPricing(clubKey, currency, locale);
  const reservation = await getReservationTerms(currency, locale);
  if (!pricing) notFound();

  const amount = type === 'reserve' ? reservation.amountFormatted : pricing.priceFormatted;
  const clubName = clubKey === 'PRIME' ? 'Legacy Prime Club' : 'Legacy Prestige Club';
  const alreadyActive = await hasActiveReservationOrMembership(session.user.id);

  const errors = {
    unauthenticated: t('errors.unauthenticated'),
    unverified: t('errors.unverified'),
    already_active: t('errors.already_active'),
    error: t('errors.error'),
  };

  return (
    <section className="mx-auto max-w-lg animate-fade-in">
      <h1 className="font-display text-3xl font-bold text-metal-gold">{t('title')}</h1>
      <div className="mt-6 space-y-3 rounded-card border border-border bg-surface p-6">
        <Row label={t('plan')} value={clubName} />
        <Row label="" value={type === 'reserve' ? t('typeReserve') : t('typeJoin')} />
        <Row label={t('amount')} value={amount} highlight />
      </div>

      <div className="mt-6">
        {type === 'reserve' ? (
          alreadyActive ? (
            <p className="rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-foreground">
              {t('errors.already_active')}
            </p>
          ) : (
            // Pago completo (join) llega en el Módulo 6; aquí va la reserva (50 €/$).
            <ReserveButton
              club={clubKey}
              label={t('payReserve')}
              pendingLabel={t('processing')}
              errors={errors}
            />
          )
        ) : (
          <p className="rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-foreground">
            {t('comingSoon')}
          </p>
        )}
      </div>

      <Link href="/club" className="mt-4 inline-block text-sm text-gold hover:underline">
        ← {t('back')}
      </Link>
    </section>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-muted">{label}</span>
      <span className={highlight ? 'font-display text-2xl font-bold text-metal-gold' : 'text-foreground'}>
        {value}
      </span>
    </div>
  );
}
