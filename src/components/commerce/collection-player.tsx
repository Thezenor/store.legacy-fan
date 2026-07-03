'use client';

import { useEffect, useState } from 'react';

export type MediaItem = { kind: 'image' | 'video'; src: string; thumb?: string };

/** Extrae el embed de YouTube/Vimeo; si no, se reproduce como <video> (mp4/webm). */
function resolveEmbed(url: string): { type: 'youtube' | 'vimeo' | 'file'; src: string } {
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([\w-]{11})/);
  if (yt) return { type: 'youtube', src: `https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1&rel=0` };
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return { type: 'vimeo', src: `https://player.vimeo.com/video/${vm[1]}?autoplay=1` };
  return { type: 'file', src: url };
}

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-current" fill="none" strokeWidth="2" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Botón circular superpuesto sobre la moneda que abre un visor (lightbox) con la
 * galería de la colección: varias fotos y varios vídeos. Si hay vídeo muestra un
 * icono de play; si solo hay fotos, un icono de galería. Respeta la orientación
 * real de los vídeos (vertical u horizontal).
 */
export function CollectionMediaViewer({ items, title }: { items: MediaItem[]; title: string }) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'ArrowRight') setIdx((i) => (i + 1) % items.length);
      if (e.key === 'ArrowLeft') setIdx((i) => (i - 1 + items.length) % items.length);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, items.length]);

  if (items.length === 0) return null;
  const hasVideo = items.some((i) => i.kind === 'video');
  const current = items[idx];
  const multi = items.length > 1;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setIdx(0);
          setOpen(true);
        }}
        aria-label={hasVideo ? `Ver vídeo de ${title}` : `Ver galería de ${title}`}
        className="group absolute bottom-[7%] right-[7%] z-10 grid h-14 w-14 place-items-center rounded-full border border-gold/70 bg-black/40 text-gold-light shadow-[0_8px_24px_-6px_rgba(0,0,0,0.7)] backdrop-blur-sm transition hover:scale-105 hover:border-gold hover:bg-gold/25 sm:h-16 sm:w-16"
      >
        {hasVideo ? (
          <svg viewBox="0 0 24 24" className="ml-0.5 h-6 w-6 fill-current sm:h-7 sm:w-7" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current sm:h-7 sm:w-7" aria-hidden="true">
            <path d="M4 5h16v11H4zM2 19h20v1H2z" opacity="0.35" />
            <path d="M6 7h9v7H6z" />
          </svg>
        )}
        {multi ? (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full border border-gold/60 bg-black px-1 text-[10px] font-semibold text-gold-light">
            {items.length}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Galería de ${title}`}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-fade-in"
        >
          {/* Flechas */}
          {multi ? (
            <>
              <button
                type="button"
                aria-label="Anterior"
                onClick={(e) => {
                  e.stopPropagation();
                  setIdx((i) => (i - 1 + items.length) % items.length);
                }}
                className="absolute left-2 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/50 text-white transition hover:bg-black/80 sm:left-6"
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6 stroke-current" fill="none" strokeWidth="2"><path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <button
                type="button"
                aria-label="Siguiente"
                onClick={(e) => {
                  e.stopPropagation();
                  setIdx((i) => (i + 1) % items.length);
                }}
                className="absolute right-2 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/50 text-white transition hover:bg-black/80 sm:right-6"
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6 stroke-current" fill="none" strokeWidth="2"><path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </>
          ) : null}

          {/* Contenido */}
          {current.kind === 'video' ? (
            (() => {
              const embed = resolveEmbed(current.src);
              return embed.type === 'file' ? (
                <div onClick={(e) => e.stopPropagation()} className="relative">
                  <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar" className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-black/60 text-white transition hover:bg-black/80"><IconClose /></button>
                  {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                  <video key={current.src} src={embed.src} controls autoPlay playsInline preload="metadata" className="max-h-[80vh] max-w-[92vw] rounded-2xl border border-gold/30 bg-black shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]" />
                </div>
              ) : (
                <div onClick={(e) => e.stopPropagation()} className="relative aspect-video w-full max-w-4xl overflow-hidden rounded-2xl border border-gold/30 bg-black shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]">
                  <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar" className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-black/60 text-white transition hover:bg-black/80"><IconClose /></button>
                  <iframe key={current.src} src={embed.src} title={`Vídeo de ${title}`} className="h-full w-full" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowFullScreen />
                </div>
              );
            })()
          ) : (
            <div onClick={(e) => e.stopPropagation()} className="relative">
              <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar" className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-black/60 text-white transition hover:bg-black/80"><IconClose /></button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={current.src} alt={`${title} ${idx + 1}`} className="max-h-[80vh] max-w-[92vw] rounded-2xl border border-gold/30 bg-black object-contain shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]" />
            </div>
          )}

          {/* Miniaturas */}
          {multi ? (
            <div onClick={(e) => e.stopPropagation()} className="absolute inset-x-0 bottom-3 flex justify-center">
              <div className="flex max-w-[92vw] gap-2 overflow-x-auto rounded-xl bg-black/50 p-2 backdrop-blur-sm">
                {items.map((it, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIdx(i)}
                    aria-label={`Ver elemento ${i + 1}`}
                    className={`relative h-12 w-12 shrink-0 overflow-hidden rounded border ${i === idx ? 'border-gold' : 'border-white/20'}`}
                  >
                    {it.kind === 'image' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.thumb ?? it.src} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="grid h-full w-full place-items-center bg-black text-gold-light">
                        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
