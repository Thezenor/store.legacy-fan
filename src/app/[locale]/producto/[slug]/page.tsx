import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { formatMoney, pickPrice } from '@/lib/commerce/money';
import { getDisplayCurrency } from '@/lib/commerce/currency';
import { ProductGallery, type GalleryImage } from '@/components/commerce/product-gallery';
import { Link } from '@/i18n/navigation';

export const dynamic = 'force-dynamic';

async function getProduct(slug: string) {
  return prisma.product.findFirst({
    where: { slug, visible: true },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      collection: { select: { name: true, slug: true, imageUrl: true, imageUrlMobile: true } },
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
  const cover = product.images[0]?.url ?? product.collection?.imageUrl ?? undefined;
  return {
    title: product.name,
    description: product.description ?? undefined,
    openGraph: cover ? { images: [{ url: cover }] } : undefined,
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

  // Imágenes del producto; si no tiene, se respalda con la imagen de la colección.
  const images: GalleryImage[] =
    product.images.length > 0
      ? product.images.map((im) => ({ url: im.url, urlMobile: im.urlMobile, alt: im.alt }))
      : product.collection?.imageUrl
        ? [{ url: product.collection.imageUrl, urlMobile: product.collection.imageUrlMobile, alt: product.name }]
        : [];

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

      <div className="mt-6 grid gap-10 md:grid-cols-2 md:items-start lg:gap-16">
        {/* Galería con efecto de moneda */}
        {images.length > 0 ? (
          <ProductGallery images={images} name={product.name} />
        ) : (
          <div className="flex h-72 items-center justify-center rounded-2xl border border-border bg-surface text-faint">
            —
          </div>
        )}

        {/* Datos */}
        <div>
          {product.collection ? <p className="eyebrow">{product.collection.name}</p> : null}
          <h1 className="mt-2 font-display text-3xl uppercase leading-tight tracking-wide text-foreground sm:text-4xl lg:text-5xl">
            {product.name}
          </h1>

          {/* Insignias */}
          <div className="mt-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-wider">
            {product.includedInPrime ? (
              <span className="rounded-full border border-gold/40 bg-gold/5 px-3 py-1 text-gold-light">{t('prodIncludedPrime')}</span>
            ) : null}
            {product.includedInPrestige ? (
              <span className="rounded-full border border-gold/40 bg-gold/5 px-3 py-1 text-gold-light">{t('prodIncludedPrestige')}</span>
            ) : null}
            {product.certificateRequired || product.hasAuthenticityQr ? (
              <span className="rounded-full border border-border px-3 py-1 text-muted">✦ {t('prodCertificate')}</span>
            ) : null}
          </div>

          {product.description ? (
            <p className="mt-6 text-[15px] leading-relaxed text-muted">{product.description}</p>
          ) : null}

          {/* Precio + compra */}
          <div className="mt-8 rounded-2xl border border-border bg-surface p-5">
            {price > 0 ? (
              <p className="font-display text-3xl text-metal-gold">{formatMoney(price, currency, locale)}</p>
            ) : null}
            <button
              type="button"
              disabled
              aria-disabled="true"
              className={`${price > 0 ? 'mt-4' : ''} w-full cursor-not-allowed rounded-lg border border-gold/40 bg-gold/10 px-6 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-gold-light/70`}
            >
              {t('prodComingSoon')}
            </button>
            <p className="mt-3 text-xs text-faint">{t('prodComingSoonHint')}</p>
            <Link href="/club" className="mt-3 inline-block text-sm text-gold hover:underline">
              {t('prodViewClub')} →
            </Link>
          </div>

          {/* Ficha técnica */}
          {specs.length > 0 ? (
            <div className="mt-8">
              <div className="hairline-gold mb-4" />
              <h2 className="font-display text-lg uppercase tracking-wide text-foreground">{t('prodSpecs')}</h2>
              <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {specs.map((s) => (
                  <div key={s.label} className="rounded-xl border border-border bg-surface p-3">
                    <dt className="text-[10px] uppercase tracking-[0.18em] text-faint">{s.label}</dt>
                    <dd className="mt-1 text-sm text-foreground">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}

          {/* Historia */}
          {product.history ? (
            <div className="mt-8">
              <div className="hairline-gold mb-4" />
              <h2 className="font-display text-lg uppercase tracking-wide text-foreground">{t('prodHistory')}</h2>
              <p className="mt-3 leading-relaxed text-muted">{product.history}</p>
            </div>
          ) : null}

          {/* Vídeo de la pieza */}
          {product.videoUrl ? (
            <div className="mt-8">
              <div className="hairline-gold mb-4" />
              <video
                controls
                preload="metadata"
                className="w-full rounded-2xl border border-border"
                src={product.videoUrl}
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
