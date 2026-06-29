import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ArtDecoMotif } from '@/components/brand/art-deco-motif';

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
      <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Texto */}
        <div className="order-2 lg:order-1">
          <p className="eyebrow">{c('siteName')} · Legacy Fan Club</p>
          <h1 className="mt-5 font-display text-4xl font-medium leading-[1.05] sm:text-6xl">
            <span className="text-foreground">{t('heroTagline')}</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            {t('heroBody')}
          </p>

          <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row">
            <Link
              href="/club"
              className="rounded bg-gold-grad px-7 py-3.5 text-center text-sm font-semibold uppercase tracking-wider text-[#160f02] transition hover:brightness-110"
            >
              {c('comparePlans')}
            </Link>
            <Link
              href="/club/prestige"
              className="rounded border border-gold/40 px-7 py-3.5 text-center text-sm font-medium uppercase tracking-wider text-gold-light transition hover:bg-surface-elevated"
            >
              {c('viewPrestige')}
            </Link>
          </div>
        </div>

        {/* Emblema Art Deco */}
        <div className="order-1 flex justify-center lg:order-2">
          <ArtDecoMotif className="w-64 max-w-full sm:w-80 lg:w-[26rem]" />
        </div>
      </div>

      {/* Marquesina de valores (manual de marca) */}
      <div className="mt-14 overflow-hidden border-y border-border py-3">
        <p className="text-center text-[11px] uppercase tracking-[0.3em] text-faint">
          Edición limitada · Plata .999 · Oro puro · Ultra High Relief · Arte coleccionable · Licencia oficial
        </p>
      </div>
    </section>
  );
}
