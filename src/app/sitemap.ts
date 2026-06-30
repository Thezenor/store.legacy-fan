import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';

const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://store.legacy-fan.com';

// Rutas públicas indexables. Se ampliará con productos/colecciones/blog en fases siguientes.
const paths = [
  '',
  '/club',
  '/club/prime',
  '/club/prestige',
  '/colecciones',
  '/legal/terms',
  '/legal/privacy',
  '/legal/cookies',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const path of paths) {
    // hreflang: alternativas por idioma (doc 11)
    const languages: Record<string, string> = {};
    for (const locale of routing.locales) {
      const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
      languages[locale] = `${base}${prefix}${path}`;
    }
    entries.push({
      url: `${base}${path}`,
      changeFrequency: 'weekly',
      priority: path === '' ? 1 : 0.8,
      alternates: { languages },
    });
  }

  return entries;
}
