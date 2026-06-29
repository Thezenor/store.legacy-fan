import { defineRouting } from 'next-intl/routing';

// Idiomas web pública (doc 00/11): ES/EN/FR/IT. Admin se restringe a ES/EN en su capa.
export const locales = ['es', 'en', 'fr', 'it'] as const;
export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = 'es';

export const routing = defineRouting({
  locales,
  defaultLocale,
  // 'as-needed': el idioma por defecto (es) no lleva prefijo; el resto sí (/en, /fr, /it).
  localePrefix: 'as-needed',
});
