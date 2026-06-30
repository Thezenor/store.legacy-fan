'use client';

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

// Selector de idioma: conserva la página actual (y sus parámetros) y cambia la locale.
export function LocaleSwitcher() {
  const current = useLocale() as AppLocale;
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const href = search ? `${pathname}?${search}` : pathname;

  return (
    <div className="flex items-center gap-0.5" role="group" aria-label="Idioma">
      {locales.map((l) => (
        <Link
          key={l}
          href={href}
          locale={l}
          aria-label={NAME[l]}
          title={NAME[l]}
          aria-current={l === current ? 'true' : undefined}
          className={`rounded px-1 text-lg leading-none transition ${
            l === current ? 'opacity-100' : 'opacity-50 hover:opacity-90'
          }`}
        >
          <span className="align-middle">{FLAG[l]}</span>
        </Link>
      ))}
    </div>
  );
}
