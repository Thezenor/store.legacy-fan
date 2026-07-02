import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { PriceBlock } from '@/components/commerce/price-block';
import { FaqSection } from '@/components/commerce/faq-section';
import { CurrencySwitcher } from '@/components/commerce/currency-switcher';
import { JsonLd } from '@/components/seo/json-ld';
import { getClubPricing, isClubActive, getPlan } from '@/lib/commerce';
import { getDisplayCurrency } from '@/lib/commerce/currency';
import { notFound } from 'next/navigation';
import { productOffer, breadcrumb } from '@/lib/seo/structured-data';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'prime' });
  return { title: t('title'), description: t('tagline') };
}

export const dynamic = 'force-dynamic';

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://store.legacy-fan.com';

export default async function PrimePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!(await isClubActive('PRIME'))) notFound();
  // En paralelo (antes 6 awaits en serie).
  const [t, pricingT, faqT, currency, plan] = await Promise.all([
    getTranslations({ locale, namespace: 'prime' }),
    getTranslations({ locale, namespace: 'pricing' }),
    getTranslations({ locale, namespace: 'faq' }),
    getDisplayCurrency(),
    getPlan('PRIME'),
  ]);
  const pricing = await getClubPricing('PRIME', currency, locale);
  // Contenido editable desde el superadmin (respaldo: textos i18n).
  const body = plan?.body || t('body');
  const slogan = plan?.slogan || t('slogan');
  const renewalNote = plan?.renewalNote || t('renewalNote');
  const includes = plan?.benefits?.length ? plan.benefits : (t.raw('includes') as string[]);
  const conditions = plan?.conditions?.length ? plan.conditions : (t.raw('conditions') as string[]);
  const faqItems = t.raw('faq') as { q: string; a: string }[];

  const jsonLd = [
    productOffer({
      name: 'Legacy Prime Club',
      description: t('tagline'),
      url: `${BASE}${locale === 'es' ? '' : `/${locale}`}/club/prime`,
      priceCents: pricing?.priceCents ?? 0,
      currency,
    }),
    breadcrumb([
      { name: 'Legacy Fan', path: locale === 'es' ? '/' : `/${locale}` },
      { name: 'Prime Club', path: locale === 'es' ? '/club/prime' : `/${locale}/club/prime` },
    ]),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <section className="mx-auto max-w-2xl animate-fade-in">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-display text-3xl font-bold text-silver sm:text-4xl">{t('title')}</h1>
          <CurrencySwitcher current={currency} />
        </div>
        <p className="mt-3 text-lg text-foreground">{t('tagline')}</p>
        <p className="mt-4 text-sm text-muted">{body}</p>
        <p className="mt-4 text-xs uppercase tracking-[0.18em] text-gold-light">{slogan}</p>

        <PriceBlock club="PRIME" currency={currency} locale={locale} />

        <h2 className="mt-8 text-sm font-semibold text-foreground">{pricingT('includes')}</h2>
        <ul className="mt-2 space-y-1.5 text-sm text-muted">
          {includes.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-silver">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6">
          <Link
            href="/checkout?club=PRIME"
            className="block rounded bg-gold-grad px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider text-[#160f02] transition hover:brightness-110 sm:inline-block sm:min-w-[18rem]"
          >
            {t('ctaReserve')}
          </Link>
          <p className="mt-3 text-xs text-faint">{renewalNote}</p>
        </div>

        {conditions.length ? (
          <div className="mt-10 border-t border-border pt-6">
            <h2 className="text-sm font-semibold text-foreground">{pricingT('conditionsTitle')}</h2>
            <ul className="mt-3 space-y-1.5 text-xs text-faint">
              {conditions.map((c) => (
                <li key={c} className="flex gap-2">
                  <span className="text-gold/60">·</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <FaqSection title={faqT('title')} items={faqItems} />
      </section>
    </>
  );
}
