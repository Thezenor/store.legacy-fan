import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'prestige' });
  return { title: t('title'), description: t('tagline') };
}

export default async function PrestigePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'prestige' });

  return (
    <section className="mx-auto max-w-2xl animate-fade-in">
      <h1 className="font-display text-3xl font-bold text-gold sm:text-4xl">{t('title')}</h1>
      <p className="mt-3 text-lg text-foreground">{t('tagline')}</p>
      <p className="mt-4 text-sm text-muted">{t('body')}</p>
      {/* Precios por fase, reserva 50€, upsell 2ª moneda (solo Prestige) y checkout: Fase 1. */}
    </section>
  );
}
