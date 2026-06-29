import { prisma } from '@/lib/prisma';
import { createCollectionAction, updateCollectionAction } from '@/lib/admin-actions';

const STATUSES = ['BORRADOR', 'PROXIMA', 'ACTIVA', 'AGOTADA', 'OCULTA', 'PRIVADA_DROP'];

export default async function AdminColecciones() {
  const collections = await prisma.collection.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { sortOrder: 'asc' },
  });

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-foreground">Colecciones</h1>

      {/* Crear */}
      <form
        action={createCollectionAction}
        className="mt-4 flex flex-wrap items-end gap-3 rounded-card border border-border bg-surface p-4"
      >
        <label className="block">
          <span className="text-xs text-muted">Nombre</span>
          <input name="name" required className="mt-1 w-48 rounded border border-border bg-background px-2 py-1.5 text-foreground" />
        </label>
        <label className="block">
          <span className="text-xs text-muted">Slug (opcional)</span>
          <input name="slug" className="mt-1 w-40 rounded border border-border bg-background px-2 py-1.5 text-foreground" />
        </label>
        <label className="block">
          <span className="text-xs text-muted">Estado</span>
          <select name="status" className="mt-1 rounded border border-border bg-background px-2 py-1.5 text-foreground">
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <button type="submit" className="rounded bg-gold-grad px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#160f02]">
          Crear
        </button>
      </form>

      {/* Listado */}
      <div className="mt-6 space-y-2">
        {collections.length === 0 ? (
          <p className="text-sm text-muted">Aún no hay colecciones.</p>
        ) : (
          collections.map((c) => (
            <form key={c.id} action={updateCollectionAction} className="flex flex-wrap items-center gap-3 rounded-card border border-border bg-surface px-4 py-3">
              <input type="hidden" name="id" value={c.id} />
              <div className="min-w-[180px] flex-1">
                <div className="text-foreground">{c.name}</div>
                <div className="font-mono text-[11px] text-faint">/{c.slug} · {c._count.products} productos</div>
              </div>
              <select name="status" defaultValue={c.status} className="rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <button type="submit" className="rounded border border-gold/40 px-3 py-1.5 text-xs uppercase tracking-wider text-gold-light hover:bg-surface-elevated">
                Guardar
              </button>
            </form>
          ))
        )}
      </div>
    </div>
  );
}
