import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { PriceBlock } from '@/components/commerce/price-block';
import { FaqSection } from '@/components/commerce/faq-section';
import { CurrencySwitcher } from '@/components/commerce/currency-switcher';
import { getPlan } from '@/lib/commerce';
import { getDisplayCurrency } from '@/lib/commerce/currency';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ club: string }>;
}): Promise<Metadata> {
  const { club } = await params;
  const plan = await getPlan(club.toUpperCase());
  return { title: plan?.name ?? 'Club', description: plan?.tagline ?? undefined };
}

// Página de un club creado desde el admin (los built-in Prime/Prestige tienen su propia página).
export default async function ClubDinamicoPage({
  params,
}: {
  params: Promise<{ locale: string; club: string }>;
}) {
  const { locale, club } = await params;
  setRequestLocale(locale);
  const code = club.toUpperCase();
  const plan = await getPlan(code);
  if (!plan || !plan.active) notFound();

  const currency = await getDisplayCurrency();
  const [pricingT, c, faqT] = await Promise.all([
    getTranslations({ locale, namespace: 'pricing' }),
    getTranslations({ locale, namespace: 'common' }),
    getTranslations({ locale, namespace: 'faq' }),
  ]);
  const faqItems = faqT.raw('items') as { q: string; a: string }[];

  return (
    <section className="mx-auto max-w-2xl animate-fade-in">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-3xl font-bold uppercase text-metal-gold sm:text-4xl">{plan.name}</h1>
        <CurrencySwitcher current={currency} />
      </div>
      {plan.tagline ? <p className="mt-3 text-lg text-foreground">{plan.tagline}</p> : null}
      {plan.body ? <p className="mt-4 text-sm text-muted">{plan.body}</p> : null}
      {plan.slogan ? (
        <p className="mt-4 text-xs uppercase tracking-[0.18em] text-gold-light">{plan.slogan}</p>
      ) : null}

      <PriceBlock club={code} currency={currency} locale={locale} />

      {plan.benefits.length ? (
        <>
          <h2 className="mt-8 text-sm font-semibold text-foreground">{pricingT('includes')}</h2>
          <ul className="mt-2 space-y-1.5 text-sm text-muted">
            {plan.benefits.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-gold">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <div className="mt-6">
        <Link
          href={`/checkout?club=${code}`}
          className="bevel inline-block bg-gold px-6 py-4 text-center text-xs font-semibold uppercase tracking-[0.16em] text-[#1a1408] transition hover:bg-gold-light"
        >
          {c('reserve')}
        </Link>
      </div>

      {plan.conditions.length ? (
        <div className="mt-10 border-t border-border pt-6">
          <h2 className="text-sm font-semibold text-foreground">{pricingT('conditionsTitle')}</h2>
          <ul className="mt-3 space-y-1.5 text-xs text-faint">
            {plan.conditions.map((cond) => (
              <li key={cond} className="flex gap-2">
                <span className="text-gold/60">·</span>
                <span>{cond}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <FaqSection title={faqT('title')} items={faqItems} />
    </section>
  );
}
