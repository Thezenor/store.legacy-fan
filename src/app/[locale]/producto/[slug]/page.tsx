import type { Metadata } from 'next';
import { cache } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { formatMoney, pickPrice } from '@/lib/commerce/money';
import { getDisplayCurrency } from '@/lib/commerce/currency';
import { ProductGallery, type GalleryImage } from '@/components/commerce/product-gallery';
import { productImg, collectionImg } from '@/lib/img';
import { Link } from '@/i18n/navigation';

export const dynamic = 'force-dynamic';

// cache(): generateMetadata y la página comparten UNA consulta por request
// (antes se ejecutaba dos veces, con ~160 KB de data URIs cada una).
const getProduct = cache(async (slug: string) => {
  return prisma.product.findFirst({
    where: { slug, visible: true },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      collection: { select: { id: true, name: true, slug: true, imageUrl: true, updatedAt: true } },
      translations: true,
    },
  });
});

/** Nombre/descripción en el idioma pedido (fallback al base). */
function localized(
  product: { name: string; description: string | null; translations: { locale: string; name: string; description: string | null }[] },
  locale: string,
) {
  const tr = product.translations.find((t) => t.locale === locale);
  return { name: tr?.name || product.name, description: tr?.description ?? product.description };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: 'Legacy Fan' };
  const { name, description } = localized(product, locale);
  // og:image solo si es una URL real: los scrapers ignoran data URIs y solo
  // inflarían el <head> (~100 KB).
  const cover = product.images[0]?.url ?? product.collection?.imageUrl ?? undefined;
  const ogImage = cover && !cover.startsWith('data:') ? cover : undefined;
  return {
    title: name,
    description: description ?? undefined,
    openGraph: ogImage ? { images: [{ url: ogImage }] } : undefined,
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
  const { name, description } = localized(product, locale);

  // Imágenes servidas por /api/img (no se incrustan los data URIs). Se prefieren
  // las data URI (robustas), pero si solo hay imágenes en el Volume (/api/media)
  // también se muestran —igual que en el admin— sirviéndolas por /api/img. Solo
  // si la pieza no tiene ninguna imagen se respalda con la de la colección.
  const dataUris = product.images.filter((im) => im.url.startsWith('data:'));
  const usable = dataUris.length > 0 ? dataUris : product.images;
  const images: GalleryImage[] =
    usable.length > 0
      ? usable.map((im) => ({ src: productImg(im.id), thumb: productImg(im.id, true), alt: im.alt }))
      : product.collection?.imageUrl
        ? [
            {
              src: collectionImg(product.collection.id, product.collection.updatedAt),
              thumb: collectionImg(product.collection.id, product.collection.updatedAt, true),
              alt: name,
            },
          ]
        : [];

  const L = (es: string, en: string) => (locale === 'es' ? es : en);
  const QUALITY_LABEL: Record<string, string> = {
    proof: 'Proof', reverse_proof: 'Reverse Proof', matte: 'Matte', antique: 'Antique', black_proof: 'Black Proof',
  };
  const FEATURE_LABEL: Record<string, string> = {
    high_relief: 'High Relief', uhr: 'Ultra High Relief', digital_printing: 'Digital Color', selective_gilding: 'Selective Gilding',
    rhodium_ruthenium: 'Rhodium / Ruthenium', glow_dark: 'Glow in the Dark', color_changing: 'Color Changing', hologram: 'Hologram',
    latent_image: 'Latent Image', laser_frosting: 'Laser Frosting', gemstone_inlay: 'Gemstone Inlay', meteorite_insert: 'Meteorite Insert',
    shape_coin: 'Shape Coin', bimetal: 'Bi-Metal', filigree: 'Filigree', incuse: 'Incuse', edge_lettering: 'Edge Lettering',
    microtext: 'Microtext', moving_elements: 'Moving Elements', enamel_inlay: 'Enamel Inlay',
  };

  const specs: { label: string; value: string | number }[] = [];
  if (product.metal) specs.push({ label: t('prodMetal'), value: product.metal });
  if (product.purity) specs.push({ label: L('Pureza', 'Purity'), value: product.purity });
  if (product.weightLabel) specs.push({ label: t('prodWeight'), value: product.weightLabel });
  if (product.finish) specs.push({ label: t('prodFinish'), value: product.finish });
  if (product.quality) specs.push({ label: L('Calidad', 'Quality'), value: QUALITY_LABEL[product.quality] ?? product.quality });
  if (product.diameter) specs.push({ label: t('prodDiameter'), value: product.diameter });
  if (product.editionSize) specs.push({ label: t('prodEdition'), value: product.editionSize.toLocaleString(locale) });
  if (product.totalUnits) specs.push({ label: L('Unidades', 'Units'), value: product.totalUnits.toLocaleString(locale) });
  if (product.mintYear) specs.push({ label: t('prodYear'), value: product.mintYear });
  if (product.faceValue) specs.push({ label: L('Valor facial', 'Face value'), value: product.faceValue });
  if (product.country) specs.push({ label: L('País', 'Country'), value: product.country });
  if (product.coa) specs.push({ label: L('Certificado', 'Certificate'), value: product.coa });
  if (product.boxInfo) specs.push({ label: L('Caja', 'Box'), value: product.boxInfo });
  if (product.capsule) specs.push({ label: L('Cápsula', 'Capsule'), value: product.capsule });

  return (
    <section className="animate-fade-in">
      <Link href="/colecciones" className="text-sm text-muted transition hover:text-foreground">
        {t('prodBack')}
      </Link>

      <div className="mt-6 grid gap-10 md:grid-cols-2 md:items-start lg:gap-16">
        {/* Galería con efecto de moneda */}
        {images.length > 0 ? (
          <ProductGallery images={images} name={name} />
        ) : (
          <div className="flex h-72 items-center justify-center rounded-2xl border border-border bg-surface text-faint">
            —
          </div>
        )}

        {/* Datos */}
        <div>
          {product.collection ? <p className="eyebrow">{product.collection.name}</p> : null}
          <h1 className="mt-2 font-display text-3xl uppercase leading-tight tracking-wide text-foreground sm:text-4xl lg:text-5xl">
            {name}
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
            {product.limitedEdition ? (
              <span className="rounded-full border border-gold/40 bg-gold/5 px-3 py-1 text-gold-light">{L('Edición limitada', 'Limited edition')}</span>
            ) : null}
            {product.specialLabel ? (
              <span className="rounded-full border border-gold/40 bg-gold/5 px-3 py-1 text-gold-light">{product.specialLabel}</span>
            ) : null}
            {product.ipLicense ? (
              <span className="rounded-full border border-border px-3 py-1 text-muted">{product.ipLicense}</span>
            ) : null}
          </div>

          {description ? (
            <p className="mt-6 text-[15px] leading-relaxed text-muted">{description}</p>
          ) : null}

          {/* Incluye / beneficios */}
          {product.features.length > 0 ? (
            <div className="mt-6">
              <h2 className="font-display text-sm uppercase tracking-wide text-foreground">{L('Incluye', 'Includes')}</h2>
              <ul className="mt-2 space-y-1 text-sm text-muted">
                {product.features.map((f) => (
                  <li key={f} className="flex gap-2"><span className="text-gold-light">✦</span><span>{f}</span></li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Acabados técnicos */}
          {product.coinFeatures.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {product.coinFeatures.map((k) => (
                <span key={k} className="rounded-full border border-border px-3 py-1 text-[11px] uppercase tracking-wider text-muted">
                  {FEATURE_LABEL[k] ?? k}
                </span>
              ))}
            </div>
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
