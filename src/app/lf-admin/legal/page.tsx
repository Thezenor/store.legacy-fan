import { prisma } from '@/lib/prisma';
import { updateLegalAction } from '@/lib/admin-actions';

// Edición de páginas legales (doc 09/15): título y cuerpo, por slug e idioma (ES/EN).
export default async function AdminLegal() {
  const pages = await prisma.legalPage.findMany({
    where: { locale: { in: ['es', 'en'] } },
    orderBy: [{ slug: 'asc' }, { locale: 'asc' }],
  });

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-foreground">Páginas legales</h1>
      <p className="mt-1 text-sm text-muted">Edita el contenido legal (ES/EN).</p>

      <div className="mt-6 space-y-4">
        {pages.map((p) => (
          <form
            key={`${p.slug}-${p.locale}`}
            action={updateLegalAction}
            className="rounded-card border border-border bg-surface p-4"
          >
            <input type="hidden" name="slug" value={p.slug} />
            <input type="hidden" name="locale" value={p.locale} />
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-faint">
                {p.slug} · {p.locale.toUpperCase()}
              </span>
              <button
                type="submit"
                className="rounded border border-gold/40 px-3 py-1.5 text-xs uppercase tracking-wider text-gold-light transition hover:bg-surface-elevated"
              >
                Guardar
              </button>
            </div>
            <input
              name="title"
              defaultValue={p.title}
              className="mt-3 w-full rounded border border-border bg-background px-2 py-1.5 text-foreground"
            />
            <textarea
              name="body"
              defaultValue={p.body}
              rows={4}
              className="mt-2 w-full rounded border border-border bg-background px-2 py-1.5 text-sm text-muted"
            />
          </form>
        ))}
      </div>
    </div>
  );
}
