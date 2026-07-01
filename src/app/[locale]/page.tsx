import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Coin } from '@/components/brand/coin';
import { CoinShowcase } from '@/components/brand/coin-showcase';
import { SpecStrip } from '@/components/brand/spec-strip';
import { ValuePillars } from '@/components/brand/value-pillars';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Pieza destacada en portada: la moneda de la colección ACTIVA (p. ej. Ganesha),
// prefiriendo la inaugural. Con imagen real y ficha técnica, para dar coherencia.
async function getFeaturedCoin() {
  const p = await prisma.product.findFirst({
    where: { visible: true, collection: { status: 'ACTIVA' } },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      collection: { select: { name: true, imageUrl: true, imageUrlMobile: true } },
    },
    orderBy: [{ isInauguralCoin: 'desc' }, { createdAt: 'asc' }],
  });
  if (!p) return null;
  // Se ignoran las imágenes /api/media (Volume, pueden no persistir); si la del
  // producto no es usable, se usa la imagen de la colección (data URI, fiable).
  const usable = p.images.find((im) => !im.url.startsWith('/api/media'));
  const img = usable
    ? { url: usable.url, urlMobile: usable.urlMobile }
    : p.collection?.imageUrl
      ? { url: p.collection.imageUrl, urlMobile: p.collection.imageUrlMobile }
      : null;
  if (!img) return null;
  const specs = [p.metal, p.weightLabel, p.mintYear ? String(p.mintYear) : null].filter(Boolean).join(' · ');
  return { slug: p.slug, name: p.name, collectionName: p.collection?.name ?? '', img, specs };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'home' });
  const c = await getTranslations({ locale, namespace: 'common' });
  const featured = await getFeaturedCoin();

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

        {/* Pieza destacada: imagen real + ficha, enlazada a su producto */}
        <div className="order-1 lg:order-2">
          {featured ? (
            <Link href={`/producto/${featured.slug}`} className="flex flex-col items-center gap-4">
              <CoinShowcase className="w-[clamp(12rem,38vw,21rem)]">
                <div className="overflow-hidden rounded-full border border-gold/20 bg-surface shadow-[0_24px_60px_-20px_rgba(0,0,0,0.85)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={featured.img.url}
                    srcSet={featured.img.urlMobile ? `${featured.img.urlMobile} 640w, ${featured.img.url} 1200w` : undefined}
                    sizes="(min-width: 1024px) 21rem, 38vw"
                    alt={featured.name}
                    className="aspect-square h-full w-full object-cover"
                  />
                </div>
              </CoinShowcase>
              <div className="text-center">
                {featured.collectionName ? <p className="eyebrow">{featured.collectionName}</p> : null}
                <p className="mt-1 font-display text-lg uppercase tracking-wide text-foreground">{featured.name}</p>
                {featured.specs ? <p className="serial mt-1 text-[11px]">{featured.specs}</p> : null}
              </div>
            </Link>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Coin metal="silver" serial="LF · 0001" className="w-[clamp(12rem,38vw,21rem)]" />
              <span className="serial text-[11px]">Pieza nº 0001 / 0999</span>
            </div>
          )}
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
