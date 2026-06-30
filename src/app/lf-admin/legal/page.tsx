import Link from 'next/link';
import { prisma } from '@/lib/prisma';

const SLUGS = [
  'terms', 'privacy', 'cookies', 'shipping', 'returns', 'membership', 'points', 'referrals', 'disclaimer',
];
const LABEL: Record<string, string> = {
  terms: 'Términos y condiciones', privacy: 'Privacidad', cookies: 'Cookies',
  shipping: 'Envíos', returns: 'Devoluciones', membership: 'Condiciones de membresía',
  points: 'Condiciones de puntos', referrals: 'Condiciones de referidos', disclaimer: 'Disclaimer',
};

export default async function AdminLegal() {
  const pages = await prisma.legalPage.findMany({ where: { locale: { in: ['es', 'en'] } } });
  const has = (slug: string, locale: string) => pages.some((p) => p.slug === slug && p.locale === locale);

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-bold text-foreground">Páginas legales</h1>
      <p className="mt-1 text-sm text-muted">Elige una página para ver o editar su contenido (ES/EN).</p>

      <div className="mt-6 divide-y divide-border rounded-card border border-border">
        {SLUGS.map((slug) => (
          <Link
            key={slug}
            href={`/lf-admin/legal/${slug}`}
            className="flex items-center justify-between px-4 py-3 transition hover:bg-surface-elevated"
          >
            <span className="text-foreground">{LABEL[slug] ?? slug}</span>
            <span className="flex items-center gap-3 text-xs text-faint">
              <span className={has(slug, 'es') ? 'text-state-green' : 'text-faint'}>ES</span>
              <span className={has(slug, 'en') ? 'text-state-green' : 'text-faint'}>EN</span>
              <span className="text-gold-light">editar →</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
