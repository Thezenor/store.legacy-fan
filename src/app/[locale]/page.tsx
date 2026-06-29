import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Coin } from '@/components/brand/coin';
import { Marquee } from '@/components/brand/marquee';
import { ValuePillars } from '@/components/brand/value-pillars';

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
      {/* Hero A · Split (réplica del prototipo) */}
      <div
        className="-mx-4 grid items-center gap-10 rounded-2xl px-4 py-12 sm:-mx-6 sm:px-10 sm:py-16 lg:grid-cols-[1.05fr_0.95fr]"
        style={{ background: 'radial-gradient(120% 80% at 80% 20%, #16140f, #08080a 60%)' }}
      >
        {/* Texto */}
        <div className="order-2 lg:order-1">
          <p style={{ letterSpacing: '0.34em' }} className="text-xs uppercase text-gold">
            {t('heroEyebrow')}
          </p>
          <h1 className="mt-6 font-display font-medium leading-[1.02] text-[clamp(2.75rem,7vw,4.75rem)]">
            <span className="block text-foreground">{t('heroL1')}</span>
            <span className="block text-foreground">{t('heroL2')}</span>
            <span className="block italic text-metal-gold">{t('heroAccent')}</span>
          </h1>
          <p className="mt-7 max-w-md text-base leading-[1.65] text-muted">{t('heroBody')}</p>

          <div className="mt-9 flex flex-col items-stretch gap-3.5 sm:flex-row">
            <Link
              href="/club"
              className="rounded bg-gold-grad px-7 py-[15px] text-center text-[13px] font-semibold uppercase tracking-[0.08em] text-[#160f02] transition hover:brightness-110"
            >
              {c('comparePlans')}
            </Link>
            <Link
              href="/club/prestige"
              className="rounded border border-white/20 px-7 py-[15px] text-center text-[13px] font-medium uppercase tracking-[0.08em] text-[#e6e3db] transition hover:bg-surface-elevated"
            >
              {c('viewPrestige')}
            </Link>
          </div>
        </div>

        {/* Moneda metálica */}
        <div className="order-1 flex justify-center lg:order-2">
          <Coin className="w-[clamp(13rem,40vw,23.75rem)]" />
        </div>
      </div>

      {/* Marquesina de valores (manual de marca) */}
      <div className="mt-12 -mx-4 sm:-mx-6">
        <Marquee text={t('marquee')} />
      </div>

      {/* Pilares de valor */}
      <ValuePillars
        eyebrow={t('pillarsEyebrow')}
        pillars={t.raw('pillars') as { n: string; title: string; body: string }[]}
      />
    </section>
  );
}
