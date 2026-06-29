import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PlanCard } from '@/components/commerce/plan-card';
import { FaqSection } from '@/components/commerce/faq-section';
import { CurrencySwitcher } from '@/components/commerce/currency-switcher';
import { JsonLd } from '@/components/seo/json-ld';
import { getClubPricing, getReservationTerms } from '@/lib/commerce';
import { getDisplayCurrency } from '@/lib/commerce/currency';
import { productOffer, faqPage, breadcrumb } from '@/lib/seo/structured-data';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });
  return {
    title: `${t('comparePlans')} · Legacy Fan Club`,
    description:
      'Legacy Fan Club: compara Prime y Prestige. Piezas en plata y cobre .999, número de socio, comunidad privada y prioridad en futuras colecciones.',
  };
}

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://store.legacy-fan.com';

export default async function ClubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const currency = await getDisplayCurrency();
  const [prime, prestige, primePricing, prestigePricing, reservation, c, faqT] = await Promise.all([
    getTranslations({ locale, namespace: 'prime' }),
    getTranslations({ locale, namespace: 'prestige' }),
    getClubPricing('PRIME', currency, locale),
    getClubPricing('PRESTIGE', currency, locale),
    getReservationTerms(currency, locale),
    getTranslations({ locale, namespace: 'common' }),
    getTranslations({ locale, namespace: 'faq' }),
  ]);
  const pricingT = await getTranslations({ locale, namespace: 'pricing' });

  if (!primePricing || !prestigePricing) return null;

  const labelsBase = {
    from: pricingT('from'),
    currentPhase: pricingT('currentPhase'),
    reservation: pricingT('reservation'),
    includesTitle: pricingT('includes'),
  };
  const faqItems = faqT.raw('items') as { q: string; a: string }[];

  const clubPath = locale === 'es' ? '/club' : `/${locale}/club`;
  const jsonLd = [
    productOffer({
      name: 'Legacy Prime Club',
      description: prime('tagline'),
      url: `${BASE}${clubPath}/prime`,
      priceCents: primePricing.priceCents,
      currency,
    }),
    productOffer({
      name: 'Legacy Prestige Club',
      description: prestige('tagline'),
      url: `${BASE}${clubPath}/prestige`,
      priceCents: prestigePricing.priceCents,
      currency,
    }),
    faqPage(faqItems),
    breadcrumb([
      { name: 'Legacy Fan', path: locale === 'es' ? '/' : `/${locale}` },
      { name: 'Legacy Fan Club', path: clubPath },
    ]),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <section className="animate-fade-in">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <h1 className="font-display text-3xl font-bold text-metal-gold sm:text-4xl">
            {c('comparePlans')}
          </h1>
          <CurrencySwitcher current={currency} />
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <PlanCard
            title={prime('title')}
            tagline={prime('tagline')}
            pricing={primePricing}
            reservationFormatted={reservation.amountFormatted}
            includes={prime.raw('includes') as string[]}
            labels={{ ...labelsBase, reserve: prime('ctaReserve'), join: prime('ctaJoin') }}
            accent="silver"
          />
          <PlanCard
            title={prestige('title')}
            tagline={prestige('tagline')}
            pricing={prestigePricing}
            reservationFormatted={reservation.amountFormatted}
            includes={prestige.raw('includes') as string[]}
            labels={{ ...labelsBase, reserve: prestige('ctaReserve'), join: prestige('ctaJoin') }}
            accent="gold"
            featured
          />
        </div>

        <FaqSection title={faqT('title')} items={faqItems} />
      </section>
    </>
  );
}
