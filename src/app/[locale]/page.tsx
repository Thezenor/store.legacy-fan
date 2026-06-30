import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Coin } from '@/components/brand/coin';
import { SpecStrip } from '@/components/brand/spec-strip';
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
      {/* Hero editorial asimétrico (retícula tipo certificado) */}
      <div className="grid items-center gap-10 py-8 sm:py-12 lg:grid-cols-[0.58fr_0.42fr]">
        {/* Texto */}
        <div className="order-2 lg:order-1">
          <p className="eyebrow">{t('heroEyebrow')}</p>
          {/* Titular en capitales grabadas (Cinzel); oro solo como filete bajo el acento */}
          <h1 className="mt-6 font-display font-semibold uppercase leading-[1.06] text-[clamp(2.1rem,6.5vw,4rem)] text-foreground">
            <span className="block">{t('heroL1')}</span>
            <span className="block">{t('heroL2')}</span>
            <span className="mt-1 inline-block border-b-2 border-gold pb-1">{t('heroAccent')}</span>
          </h1>
          <p className="mt-8 max-w-md text-[15px] leading-[1.75] text-muted">{t('heroBody')}</p>

          <div className="mt-9 flex flex-col items-stretch gap-3.5 sm:flex-row">
            <Link
              href="/club"
              className="bevel bg-gold px-7 py-[15px] text-center text-[12px] font-semibold uppercase tracking-[0.16em] text-[#1a1408] transition hover:bg-gold-light"
            >
              {c('comparePlans')}
            </Link>
            <Link
              href="/club/prestige"
              className="px-7 py-[15px] text-center text-[12px] font-medium uppercase tracking-[0.16em] text-foreground underline-offset-8 transition hover:underline"
            >
              {c('viewPrestige')} →
            </Link>
          </div>
        </div>

        {/* Moneda acuñada con su serial */}
        <div className="order-1 flex flex-col items-center gap-3 lg:order-2">
          <Coin metal="silver" serial="LF · 0001" className="w-[clamp(12rem,38vw,21rem)]" />
          <span className="serial text-[11px]">Pieza nº 0001 / 0999</span>
        </div>
      </div>

      {/* Cartela de especificación (sustituye la marquesina) */}
      <SpecStrip items={t.raw('specs') as string[]} />

      {/* Pilares de valor */}
      <ValuePillars
        eyebrow={t('pillarsEyebrow')}
        pillars={t.raw('pillars') as { n: string; title: string; body: string }[]}
      />
    </section>
  );
}
