'use client';

import { useEffect, useState } from 'react';

/** Extrae el embed de YouTube/Vimeo; si no, se reproduce como <video> (mp4/webm). */
function resolveEmbed(url: string): { type: 'youtube' | 'vimeo' | 'file'; src: string } {
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([\w-]{11})/);
  if (yt) return { type: 'youtube', src: `https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1&rel=0` };
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return { type: 'vimeo', src: `https://player.vimeo.com/video/${vm[1]}?autoplay=1` };
  return { type: 'file', src: url };
}

/**
 * Botón circular de reproducción superpuesto sobre la moneda (abajo-derecha),
 * al estilo de la portada. Al pulsarlo abre un modal con el vídeo.
 */
export function CollectionPlayButton({ url, title }: { url: string; title: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const embed = resolveEmbed(url);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Reproducir vídeo de ${title}`}
        className="group absolute bottom-[7%] right-[7%] z-10 grid h-14 w-14 place-items-center rounded-full border border-gold/70 bg-black/40 text-gold-light shadow-[0_8px_24px_-6px_rgba(0,0,0,0.7)] backdrop-blur-sm transition hover:scale-105 hover:border-gold hover:bg-gold/25 sm:h-16 sm:w-16"
      >
        {/* Triángulo de play (ligeramente desplazado a la derecha para centrar óptico) */}
        <svg viewBox="0 0 24 24" className="ml-0.5 h-6 w-6 fill-current sm:h-7 sm:w-7" aria-hidden="true">
          <path d="M8 5v14l11-7z" />
        </svg>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Vídeo de ${title}`}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative aspect-video w-full max-w-4xl overflow-hidden rounded-2xl border border-gold/30 bg-black shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-black/60 text-white transition hover:bg-black/80"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-current" fill="none" strokeWidth="2" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
            {embed.type === 'file' ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video src={embed.src} controls autoPlay playsInline className="h-full w-full bg-black" />
            ) : (
              <iframe
                src={embed.src}
                title={`Vídeo de ${title}`}
                className="h-full w-full"
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                allowFullScreen
              />
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
