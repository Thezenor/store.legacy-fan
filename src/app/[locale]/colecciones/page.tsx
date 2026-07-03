import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { CollectionStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { Coin } from '@/components/brand/coin';
import { CoinShowcase } from '@/components/brand/coin-showcase';
import { collectionImg, collectionMediaImg } from '@/lib/img';
import { CollectionMediaViewer, type MediaItem } from '@/components/commerce/collection-player';
import { Link } from '@/i18n/navigation';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'collections' });
  return { title: t('title'), description: t('tagline') };
}

// Colecciones vienen de la BD/admin → render dinámico (evita BD en build).
export const dynamic = 'force-dynamic';

const METALS = ['silver', 'gold', 'copper'] as const;

function statusLabel(status: CollectionStatus, t: (k: string) => string): string | null {
  if (status === 'ACTIVA') return t('statusActiva');
  if (status === 'PROXIMA') return t('statusProxima');
  if (status === 'AGOTADA') return t('statusAgotada');
  return null;
}

export default async function ColeccionesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'collections' });

  // Colecciones públicas (no borrador/oculta). NO se seleccionan las imágenes
  // (data URIs ~150 KB): se sirven por /api/img. Una consulta ligera aparte
  // dice qué colecciones tienen imagen.
  const [collections, withImage] = await Promise.all([
    prisma.collection.findMany({
      where: { status: { in: ['ACTIVA', 'PROXIMA', 'AGOTADA'] } },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        status: true,
        updatedAt: true,
        videoUrl: true,
        // Solo id+kind: las imágenes son data URIs y se sirven por /api/img; el
        // url del vídeo (ligero) se trae aparte para no arrastrar los data URIs.
        media: { select: { id: true, kind: true }, orderBy: { sortOrder: 'asc' } },
        products: {
          where: { visible: true },
          select: { id: true, slug: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    }),
    prisma.collection.findMany({
      where: { status: { in: ['ACTIVA', 'PROXIMA', 'AGOTADA'] }, imageUrl: { not: null } },
      select: { id: true },
    }),
  ]);
  const hasImage = new Set(withImage.map((c) => c.id));
  // URLs de los vídeos (ligeras: /api/media o externas) por id de media.
  const videoRows = await prisma.collectionMedia.findMany({
    where: { kind: 'VIDEO', collection: { status: { in: ['ACTIVA', 'PROXIMA', 'AGOTADA'] } } },
    select: { id: true, url: true },
  });
  const videoUrlById = new Map(videoRows.map((v) => [v.id, v.url]));

  return (
    <section className="animate-fade-in">
      <div className="py-6 text-center sm:py-10">
        <p className="eyebrow">{t('eyebrow')}</p>
        <h1 className="mt-4 font-display text-4xl uppercase tracking-wide text-foreground sm:text-6xl">
          {t('title')}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm text-muted sm:text-base">{t('tagline')}</p>
      </div>

      {collections.length === 0 ? (
        <p className="py-10 text-center text-muted">{t('empty')}</p>
      ) : (
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((col, i) => {
            const label = statusLabel(col.status, t);
            const soon = col.status === 'PROXIMA';
            const href = col.products[0] ? `/producto/${col.products[0].slug}` : null;
            // Media de la galería: portada + fotos + vídeos (varios). El botón/visor
            // solo aparece si hay algo además de la portada (fotos o vídeos).
            const galleryImages = col.media.filter((m) => m.kind === 'IMAGE');
            const galleryVideos = col.media.filter((m) => m.kind === 'VIDEO');
            const videoSrcs = galleryVideos.map((m) => videoUrlById.get(m.id)).filter((u): u is string => !!u);
            const hasLegacyVideo = !!col.videoUrl && !videoSrcs.includes(col.videoUrl);
            const mediaItems: MediaItem[] = [];
            if (hasImage.has(col.id)) {
              mediaItems.push({ kind: 'image', src: collectionImg(col.id, col.updatedAt), thumb: collectionImg(col.id, col.updatedAt, true) });
            }
            for (const m of galleryImages) {
              mediaItems.push({ kind: 'image', src: collectionMediaImg(m.id), thumb: collectionMediaImg(m.id, true) });
            }
            for (const src of videoSrcs) mediaItems.push({ kind: 'video', src });
            if (hasLegacyVideo) mediaItems.push({ kind: 'video', src: col.videoUrl! });
            const showViewer = galleryImages.length > 0 || videoSrcs.length > 0 || hasLegacyVideo;
            const media = (
                <CoinShowcase className="w-[clamp(11rem,30vw,16rem)]">
                  {hasImage.has(col.id) ? (
                    <div className={`overflow-hidden rounded-full border border-gold/20 bg-surface shadow-[0_20px_44px_-16px_rgba(0,0,0,0.8)] ${soon ? 'opacity-40 blur-[1px]' : ''}`}>
                      {/* Imagen servida por /api/img (cacheable), no incrustada. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={collectionImg(col.id, col.updatedAt, true)}
                        alt={col.name}
                        className="aspect-square h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  ) : (
                    <Coin
                      metal={METALS[i % METALS.length]}
                      serial={col.name.slice(0, 14)}
                      legend={`${col.name.toUpperCase()} · LEGACY FAN ·`}
                      className={`w-full ${soon ? 'opacity-35 blur-[1px]' : ''}`}
                    />
                  )}
                </CoinShowcase>
            );
            const caption = (
              <>
                <h2 className="mt-5 font-display text-lg uppercase tracking-wide text-foreground">
                  {col.name}
                </h2>
                {label ? (
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-gold">
                    ✦ {label}
                    {col.products.length > 0 ? <span className="text-faint"> · {col.products.length}</span> : null}
                  </p>
                ) : null}
              </>
            );
            return (
              <article key={col.id} className="flex flex-col items-center text-center">
                {/* Media con botón de play superpuesto (sibling del enlace, sin anidar <a>) */}
                <div className="relative w-[clamp(11rem,30vw,16rem)]">
                  {href ? (
                    <Link href={href} className="block">{media}</Link>
                  ) : (
                    media
                  )}
                  {showViewer ? <CollectionMediaViewer items={mediaItems} title={col.name} /> : null}
                </div>
                {href ? (
                  <Link href={href} className="flex flex-col items-center">{caption}</Link>
                ) : (
                  caption
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
