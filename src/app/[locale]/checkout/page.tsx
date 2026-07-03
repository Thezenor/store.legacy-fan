import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getClubPricing, getReservationTerms, getPlan } from '@/lib/commerce';
import { getSecondCoinUpsell } from '@/lib/commerce/upsell';
import { getDisplayCurrency } from '@/lib/commerce/currency';
import { getSetting } from '@/lib/commerce/settings';
import { getPendingReservation } from '@/lib/checkout/reservation';
import { prisma } from '@/lib/prisma';
import { CheckoutForm } from '@/components/checkout/checkout-form';
import { ResumePaymentButton } from '@/components/checkout/resume-payment-button';
import { Link } from '@/i18n/navigation';

export const dynamic = 'force-dynamic';

/**
 * Checkout unificado (doc usuario): el visitante elige reserva (50 €/$) o pago
 * completo y, si no tiene cuenta, se registra o inicia sesión en el mismo paso.
 * Tras aceptar términos pasa a PayPal. No exige verificación previa de email.
 */
export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ club?: string; type?: string; ref?: string }>;
}) {
  const { locale } = await params;
  const { club, ref } = await searchParams;
  setRequestLocale(locale);

  if (!club) notFound();

  const currency = await getDisplayCurrency();
  const t = await getTranslations({ locale, namespace: 'checkout' });

  const [plan, pricing] = await Promise.all([getPlan(club), getClubPricing(club, currency, locale)]);
  if (!plan || !plan.active || !pricing) notFound();
  const reservation = await getReservationTerms(currency, locale, club);
  const upsell = await getSecondCoinUpsell(club, currency, locale);
  const subscriptionMode = (await getSetting<string>('billing.mode')) === 'subscription';

  const session = await auth();
  const isLoggedIn = !!session?.user?.id;
  // Distinguir socio de pleno derecho (bloquea) de un proceso pendiente (se
  // ofrece continuar el pago, sin decir "ya tienes uno en proceso").
  let fullyActive = false;
  let hasPending = false;
  if (isLoggedIn) {
    const uid = session!.user.id;
    const [membership, completed, pending] = await Promise.all([
      prisma.membership.findUnique({ where: { userId: uid }, select: { status: true } }),
      prisma.reservation.findFirst({ where: { userId: uid, status: 'PAGO_COMPLETO' }, select: { id: true } }),
      getPendingReservation(uid),
    ]);
    fullyActive = membership?.status === 'SOCIO_ACTIVO' || !!completed;
    hasPending = !fullyActive && !!pending;
  }

  return (
    <section className="mx-auto max-w-xl animate-fade-in">
      <p className="eyebrow text-gold-light">{plan.name}</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-metal-gold">{t('title')}</h1>

      {fullyActive ? (
        <div className="mt-6 rounded-card border border-gold/40 bg-gold/10 p-6">
          <p className="text-sm text-foreground">{t('errors.already_active')}</p>
          <Link href="/account" className="mt-3 inline-block text-sm text-gold hover:underline">
            {t('goToAccount')} →
          </Link>
        </div>
      ) : hasPending ? (
        <div className="mt-6 rounded-card border border-gold/60 bg-gold/10 p-6">
          <h2 className="font-display text-lg font-semibold text-foreground">{t('resumeTitle')}</h2>
          <p className="mt-1 text-sm text-muted">{t('resumeBody')}</p>
          <div className="mt-4">
            <ResumePaymentButton label={t('resumeCta')} pendingLabel={t('processing')} />
          </div>
          <Link href="/account" className="mt-3 inline-block text-sm text-gold hover:underline">
            {t('goToAccount')} →
          </Link>
        </div>
      ) : (
        <div className="mt-6">
          <CheckoutForm
            club={club}
            isLoggedIn={isLoggedIn}
            reserveFormatted={reservation.amountFormatted}
            fullFormatted={pricing.priceFormatted}
            listFormatted={pricing.listPriceFormatted}
            subscriptionMode={subscriptionMode}
            refCode={ref}
            upsell={
              upsell
                ? {
                    coinA: upsell.coinA,
                    coinB: upsell.coinB,
                    offerSecond: upsell.offerSecond,
                    reserveFormatted: reservation.amountFormatted,
                    secondFormatted: upsell.secondFormatted,
                    listFormatted: upsell.listFormatted,
                  }
                : null
            }
          />
        </div>
      )}

      <Link href="/club" className="mt-6 inline-block text-sm text-gold hover:underline">
        ← {t('back')}
      </Link>
    </section>
  );
}
