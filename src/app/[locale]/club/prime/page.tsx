import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { PriceBlock } from '@/components/commerce/price-block';
import { FaqSection } from '@/components/commerce/faq-section';
import { CurrencySwitcher } from '@/components/commerce/currency-switcher';
import { JsonLd } from '@/components/seo/json-ld';
import { getClubPricing } from '@/lib/commerce';
import { getDisplayCurrency } from '@/lib/commerce/currency';
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
  const t = await getTranslations({ locale, namespace: 'prime' });
  const pricingT = await getTranslations({ locale, namespace: 'pricing' });
  const faqT = await getTranslations({ locale, namespace: 'faq' });
  const currency = await getDisplayCurrency();
  const pricing = await getClubPricing('PRIME', currency, locale);
  const includes = t.raw('includes') as string[];
  const faqItems = faqT.raw('items') as { q: string; a: string }[];

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
        <p className="mt-4 text-sm text-muted">{t('body')}</p>

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

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link
            href="/checkout?club=PRIME&type=join"
            className="rounded bg-gold-grad px-6 py-3 text-center text-sm font-semibold uppercase tracking-wider text-[#160f02] transition hover:brightness-110"
          >
            {t('ctaJoin')}
          </Link>
          <Link
            href="/checkout?club=PRIME&type=reserve"
            className="rounded border border-gold/40 px-6 py-3 text-center text-sm font-medium uppercase tracking-wider text-gold-light transition hover:bg-surface-elevated"
          >
            {t('ctaReserve')}
          </Link>
        </div>

        <FaqSection title={faqT('title')} items={faqItems} />
      </section>
    </>
  );
}
