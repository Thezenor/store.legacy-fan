'use client';

import { useState } from 'react';
import { CoinShowcase } from '@/components/brand/coin-showcase';

export interface GalleryImage {
  url: string;
  urlMobile?: string | null;
  alt?: string | null;
}

// Galería de la ficha de producto: imagen principal con el efecto de moneda
// (halo + flotación + inclinación) y miniaturas para cambiar de imagen.
export function ProductGallery({ images, name }: { images: GalleryImage[]; name: string }) {
  const [active, setActive] = useState(0);
  const main = images[active] ?? images[0];
  if (!main) return null;

  return (
    <div className="md:sticky md:top-24">
      <div className="flex justify-center">
        <CoinShowcase className="w-[clamp(15rem,62vw,24rem)]">
          <div className="overflow-hidden rounded-full border border-gold/20 bg-surface shadow-[0_24px_60px_-20px_rgba(0,0,0,0.85)]">
            {/* Una sola variante: con data URIs el srcSet duplicaba el HTML. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={main.url}
              alt={main.alt ?? name}
              className="aspect-square h-full w-full object-cover"
            />
          </div>
        </CoinShowcase>
      </div>

      {images.length > 1 ? (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {images.map((im, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`${name} ${i + 1}`}
              aria-current={i === active ? 'true' : undefined}
              className={`h-16 w-16 overflow-hidden rounded-full border transition ${
                i === active ? 'border-gold' : 'border-border hover:border-gold/50'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={im.urlMobile ?? im.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
