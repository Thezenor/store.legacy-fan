import { prisma } from '@/lib/prisma';
import { upsertSeoAction } from '@/lib/admin-actions';

const inp = 'rounded border border-border bg-background px-2 py-1.5 text-foreground';
// Rutas públicas indexables donde editar metadatos (doc 09/11).
const PATHS = ['/', '/club', '/club/prime', '/club/prestige'];

export default async function AdminSeo() {
  const existing = await prisma.seoMetadata.findMany();
  const find = (path: string, locale: string) =>
    existing.find((e) => e.path === path && e.locale === locale);

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl font-bold text-foreground">SEO / GEO</h1>
      <p className="mt-1 text-sm text-muted">Metatítulos, descripciones y keywords por ruta e idioma.</p>

      <div className="mt-6 space-y-3">
        {PATHS.map((path) =>
          ['es', 'en'].map((locale) => {
            const e = find(path, locale);
            return (
              <form key={`${path}-${locale}`} action={upsertSeoAction} className="rounded-card border border-border bg-surface p-4">
                <input type="hidden" name="path" value={path} />
                <input type="hidden" name="locale" value={locale} />
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-faint">{path} · {locale.toUpperCase()}</span>
                  <button type="submit" className="border border-gold/40 px-3 py-1.5 text-xs uppercase tracking-wider text-gold-light hover:bg-surface-elevated">Guardar</button>
                </div>
                <input name="title" defaultValue={e?.title ?? ''} placeholder="Metatítulo" className={`mt-2 w-full ${inp}`} />
                <input name="description" defaultValue={e?.description ?? ''} placeholder="Metadescripción" className={`mt-2 w-full ${inp}`} />
                <input name="keywords" defaultValue={e?.keywords ?? ''} placeholder="keywords, separadas, por comas" className={`mt-2 w-full ${inp}`} />
              </form>
            );
          }),
        )}
      </div>
    </div>
  );
}
