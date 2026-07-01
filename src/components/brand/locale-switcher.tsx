'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Link, usePathname } from '@/i18n/navigation';
import { locales, type AppLocale } from '@/i18n/routing';

// Banderas por idioma (emoji regional).
const FLAG: Record<AppLocale, string> = {
  es: '🇪🇸',
  en: '🇬🇧',
  fr: '🇫🇷',
  it: '🇮🇹',
};
const NAME: Record<AppLocale, string> = {
  es: 'Español',
  en: 'English',
  fr: 'Français',
  it: 'Italiano',
};

// Selector de idioma desplegable: muestra solo la bandera actual y despliega el
// resto al pulsar (ocupa menos espacio). Conserva la página y sus parámetros.
export function LocaleSwitcher() {
  const current = useLocale() as AppLocale;
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const href = search ? `${pathname}?${search}` : pathname;

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Idioma: ${NAME[current]}`}
        className="inline-flex h-8 items-center gap-1 rounded-full border border-border bg-surface px-2.5 text-base leading-none transition hover:bg-surface-elevated"
      >
        <span className="align-middle">{FLAG[current]}</span>
        <span aria-hidden className={`text-[10px] text-muted transition ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 min-w-[9rem] overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-card"
        >
          {locales.map((l) => (
            <Link
              key={l}
              href={href}
              locale={l}
              role="menuitem"
              aria-current={l === current ? 'true' : undefined}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 text-sm transition ${
                l === current
                  ? 'bg-gold/10 text-gold-light'
                  : 'text-muted hover:bg-surface-elevated hover:text-foreground'
              }`}
            >
              <span className="text-base leading-none">{FLAG[l]}</span>
              {NAME[l]}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
