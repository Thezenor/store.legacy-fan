import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { PlanCard } from '@/components/commerce/plan-card';
import { FaqSection } from '@/components/commerce/faq-section';
import { CurrencySwitcher } from '@/components/commerce/currency-switcher';
import { JsonLd } from '@/components/seo/json-ld';
import { getClubPricing, getReservationTerms, isClubActive, listActiveClubs, getPlan } from '@/lib/commerce';
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

// Precios/colección dependen de la BD y del admin → render dinámico (evita BD en build).
export const dynamic = 'force-dynamic';

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://store.legacy-fan.com';

export default async function ClubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const currency = await getDisplayCurrency();
  const [prime, prestige, primePricing, prestigePricing, primeRes, prestigeRes, primeActive, prestigeActive, c, faqT] =
    await Promise.all([
      getTranslations({ locale, namespace: 'prime' }),
      getTranslations({ locale, namespace: 'prestige' }),
      getClubPricing('PRIME', currency, locale),
      getClubPricing('PRESTIGE', currency, locale),
      getReservationTerms(currency, locale, 'PRIME'),
      getReservationTerms(currency, locale, 'PRESTIGE'),
      isClubActive('PRIME'),
      isClubActive('PRESTIGE'),
      getTranslations({ locale, namespace: 'common' }),
      getTranslations({ locale, namespace: 'faq' }),
    ]);
  const pricingT = await getTranslations({ locale, namespace: 'pricing' });
  const introT = await getTranslations({ locale, namespace: 'clubIntro' });
  const [primePlan, prestigePlan] = await Promise.all([getPlan('PRIME'), getPlan('PRESTIGE')]);

  if (!primePricing || !prestigePricing) return null;

  const introReasons = introT.raw('reasons') as { title: string; body: string }[];
  // Beneficios desde el superadmin si los hay; si no, los textos i18n.
  const primeIncludes = primePlan?.benefits?.length ? primePlan.benefits : (prime.raw('includes') as string[]);
  const prestigeIncludes = prestigePlan?.benefits?.length
    ? prestigePlan.benefits
    : (prestige.raw('includes') as string[]);

  const labelsBase = {
    from: pricingT('from'),
    reserveFrom: pricingT('reserveFrom'),
    fullPrice: pricingT('fullPrice'),
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
        {/* Por qué hacerse socio (copy de marca, antes de la comparativa) */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow text-gold-light">{introT('eyebrow')}</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-metal-gold sm:text-4xl">
            {introT('title')}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-foreground sm:text-lg">{introT('lead')}</p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {introReasons.map((r) => (
            <div key={r.title} className="bevel border border-border bg-surface p-5">
              <h3 className="font-display text-lg text-gold-light">{r.title}</h3>
              <p className="mt-2 text-sm text-muted">{r.body}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm uppercase tracking-[0.18em] text-faint">{introT('closing')}</p>

        {/* Comparativa de planes */}
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-10 sm:flex-row sm:items-center">
          <h2 className="font-display text-2xl font-bold text-metal-gold sm:text-3xl">
            {c('comparePlans')}
          </h2>
          <CurrencySwitcher current={currency} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {primeActive ? (
            <PlanCard
              title={prime('title')}
              tagline={prime('tagline')}
              pricing={primePricing}
              reservationFormatted={primeRes.amountFormatted}
              includes={primeIncludes}
              labels={{ ...labelsBase, reserve: prime('ctaReserve') }}
              accent="silver"
            />
          ) : null}
          {prestigeActive ? (
            <PlanCard
              title={prestige('title')}
              tagline={prestige('tagline')}
              pricing={prestigePricing}
              reservationFormatted={prestigeRes.amountFormatted}
              includes={prestigeIncludes}
              labels={{ ...labelsBase, reserve: prestige('ctaReserve') }}
              accent="gold"
              featured
            />
          ) : null}
        </div>

        {/* Clubs adicionales creados desde el admin */}
        <ExtraClubs viewLabel={c('viewClub')} />

        <FaqSection title={faqT('title')} items={faqItems} />
      </section>
    </>
  );
}

// Clubs extra (creados en admin) que no son los built-in Prime/Prestige.
async function ExtraClubs({ viewLabel }: { viewLabel: string }) {
  const extra = (await listActiveClubs()).filter((p) => p.club !== 'PRIME' && p.club !== 'PRESTIGE');
  if (extra.length === 0) return null;
  return (
    <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {extra.map((p) => (
        <Link
          key={p.id}
          href={`/club/${p.club}`}
          className="bevel block border border-gold/40 bg-surface p-6 transition hover:border-gold/60"
        >
          <h2 className="font-display text-2xl uppercase text-gold-light">{p.name}</h2>
          {p.tagline ? <p className="mt-2 text-sm text-muted">{p.tagline}</p> : null}
          <span className="mt-4 inline-block text-xs uppercase tracking-wider text-gold">{viewLabel} →</span>
        </Link>
      ))}
    </div>
  );
}
