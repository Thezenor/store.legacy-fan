import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PriceBlock } from '@/components/commerce/price-block';
import { resolveCurrency } from '@/lib/commerce';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'prime' });
  return { title: t('title'), description: t('tagline') };
}

export default async function PrimePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'prime' });

  return (
    <section className="mx-auto max-w-2xl animate-fade-in">
      <h1 className="font-display text-3xl font-bold text-silver sm:text-4xl">{t('title')}</h1>
      <p className="mt-3 text-lg text-foreground">{t('tagline')}</p>
      <p className="mt-4 text-sm text-muted">{t('body')}</p>
      <PriceBlock club="PRIME" currency={resolveCurrency()} locale={locale} />
      {/* Checkout (reserva/pago completo): Módulos 4 y 6. */}
    </section>
  );
}
