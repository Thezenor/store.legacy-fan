import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { formatMoney, pickPrice } from '@/lib/commerce/money';
import { getDisplayCurrency } from '@/lib/commerce/currency';
import { Coin } from '@/components/brand/coin';
import { CoinShowcase } from '@/components/brand/coin-showcase';
import { Link } from '@/i18n/navigation';

export const dynamic = 'force-dynamic';

async function getProduct(slug: string) {
  return prisma.product.findFirst({
    where: { slug, visible: true },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      collection: { select: { name: true, slug: true } },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: 'Legacy Fan' };
  return {
    title: product.name,
    description: product.description ?? undefined,
    openGraph: product.images[0]?.url
      ? { images: [{ url: product.images[0].url }] }
      : undefined,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'collections' });

  const product = await getProduct(slug);
  if (!product) notFound();

  const currency = await getDisplayCurrency();
  const price = pickPrice(product, currency);
  const img = product.images[0];

  const specs: { label: string; value: string | number }[] = [];
  if (product.metal) specs.push({ label: t('prodMetal'), value: product.metal });
  if (product.weightLabel) specs.push({ label: t('prodWeight'), value: product.weightLabel });
  if (product.finish) specs.push({ label: t('prodFinish'), value: product.finish });
  if (product.diameter) specs.push({ label: t('prodDiameter'), value: product.diameter });
  if (product.editionSize) specs.push({ label: t('prodEdition'), value: product.editionSize.toLocaleString(locale) });
  if (product.mintYear) specs.push({ label: t('prodYear'), value: product.mintYear });

  return (
    <section className="animate-fade-in">
      <Link href="/colecciones" className="text-sm text-muted transition hover:text-foreground">
        {t('prodBack')}
      </Link>

      <div className="mt-6 grid gap-10 md:grid-cols-2 md:items-start">
        {/* Imagen / moneda */}
        <div className="flex justify-center md:sticky md:top-24">
          <CoinShowcase className="w-[clamp(14rem,60vw,22rem)]">
            {img ? (
              <div className="overflow-hidden rounded-full border border-gold/20 bg-surface shadow-[0_20px_44px_-16px_rgba(0,0,0,0.8)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  srcSet={img.urlMobile ? `${img.urlMobile} 640w, ${img.url} 1200w` : undefined}
                  sizes="(min-width: 768px) 22rem, 60vw"
                  alt={img.alt ?? product.name}
                  className="aspect-square h-full w-full object-cover"
                />
              </div>
            ) : (
              <Coin metal="silver" serial={product.name.slice(0, 14)} legend={`${product.name.toUpperCase()} · LEGACY FAN ·`} className="w-full" />
            )}
          </CoinShowcase>
        </div>

        {/* Datos */}
        <div>
          {product.collection ? (
            <p className="eyebrow">{product.collection.name}</p>
          ) : null}
          <h1 className="mt-2 font-display text-3xl uppercase tracking-wide text-foreground sm:text-4xl">
            {product.name}
          </h1>

          {/* Insignias */}
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-wider">
            {product.includedInPrime ? (
              <span className="rounded-full border border-gold/40 px-3 py-1 text-gold-light">{t('prodIncludedPrime')}</span>
            ) : null}
            {product.includedInPrestige ? (
              <span className="rounded-full border border-gold/40 px-3 py-1 text-gold-light">{t('prodIncludedPrestige')}</span>
            ) : null}
            {product.certificateRequired || product.hasAuthenticityQr ? (
              <span className="rounded-full border border-border px-3 py-1 text-muted">✦ {t('prodCertificate')}</span>
            ) : null}
          </div>

          {product.description ? (
            <p className="mt-5 leading-relaxed text-muted">{product.description}</p>
          ) : null}

          {/* Precio */}
          {price > 0 ? (
            <p className="mt-6 font-display text-3xl text-metal-gold">
              {formatMoney(price, currency, locale)}
            </p>
          ) : null}

          {/* Compra (aún no activa) */}
          <div className="mt-4">
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="w-full cursor-not-allowed rounded-lg border border-gold/40 bg-gold/10 px-6 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-gold-light/70 sm:w-auto"
            >
              {t('prodComingSoon')}
            </button>
            <p className="mt-2 text-xs text-faint">{t('prodComingSoonHint')}</p>
            <Link
              href="/club"
              className="mt-3 inline-block text-sm text-gold hover:underline"
            >
              {t('prodViewClub')} →
            </Link>
          </div>

          {/* Ficha técnica */}
          {specs.length > 0 ? (
            <div className="mt-8">
              <h2 className="font-display text-lg uppercase tracking-wide text-foreground">{t('prodSpecs')}</h2>
              <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                {specs.map((s) => (
                  <div key={s.label} className="flex justify-between border-b border-border/60 py-2 text-sm">
                    <dt className="text-muted">{s.label}</dt>
                    <dd className="text-foreground">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}

          {/* Historia */}
          {product.history ? (
            <div className="mt-8">
              <h2 className="font-display text-lg uppercase tracking-wide text-foreground">{t('prodHistory')}</h2>
              <p className="mt-3 leading-relaxed text-muted">{product.history}</p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
