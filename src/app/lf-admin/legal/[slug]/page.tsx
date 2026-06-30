import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Locale } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { updateLegalAction } from '@/lib/admin-actions';

const SLUGS = ['terms', 'privacy', 'cookies', 'shipping', 'returns', 'membership', 'points', 'referrals', 'disclaimer'];
const inp = 'w-full rounded border border-border bg-background px-2 py-1.5 text-foreground';

export default async function AdminLegalEdit({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!SLUGS.includes(slug)) notFound();

  const existing = await prisma.legalPage.findMany({ where: { slug } });
  const get = (locale: Locale) => existing.find((p) => p.locale === locale);

  return (
    <div className="max-w-2xl">
      <Link href="/lf-admin/legal" className="text-sm text-muted hover:text-foreground">← Páginas legales</Link>
      <h1 className="mt-2 font-display text-3xl font-bold text-foreground">{slug}</h1>

      <div className="mt-6 space-y-4">
        {(['es', 'en'] as Locale[]).map((locale) => {
          const e = get(locale);
          return (
            <form key={locale} action={updateLegalAction} className="rounded-card border border-border bg-surface p-4">
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="locale" value={locale} />
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-faint">{locale}</span>
                <button className="border border-gold/40 px-3 py-1.5 text-xs uppercase tracking-wider text-gold-light hover:bg-surface-elevated">Guardar</button>
              </div>
              <input name="title" defaultValue={e?.title ?? ''} placeholder="Título" className={`mt-2 ${inp}`} />
              <textarea name="body" defaultValue={e?.body ?? ''} rows={10} placeholder="Contenido" className={`mt-2 ${inp}`} />
            </form>
          );
        })}
      </div>
    </div>
  );
}
