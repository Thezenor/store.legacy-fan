import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'home' });
  const c = await getTranslations({ locale, namespace: 'common' });

  return (
    <section className="animate-fade-in">
      <div className="py-10 text-center sm:py-16">
        <h1 className="font-display text-4xl font-bold text-metal-gold sm:text-6xl">
          {t('heroTitle')}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-foreground sm:text-xl">
          {t('heroTagline')}
        </p>
        <p className="mx-auto mt-4 max-w-2xl text-sm text-muted sm:text-base">{t('heroBody')}</p>

        {/* CTA mobile-first: apilados en móvil, en fila en desktop */}
        <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/club/prime"
            className="rounded-card border border-silver/40 bg-surface px-6 py-3 font-medium text-foreground transition hover:bg-surface-elevated"
          >
            {c('viewPrime')}
          </Link>
          <Link
            href="/club/prestige"
            className="rounded-card border border-gold/50 bg-surface px-6 py-3 font-medium text-gold transition hover:bg-surface-elevated"
          >
            {c('viewPrestige')}
          </Link>
          <Link
            href="/club"
            className="rounded-card bg-gold px-6 py-3 font-semibold text-background transition hover:bg-gold-light"
          >
            {c('reserve')}
          </Link>
        </div>
      </div>
    </section>
  );
}
