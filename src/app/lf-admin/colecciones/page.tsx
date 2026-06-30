import {
  createCollectionAction,
  updateCollectionAction,
  deleteCollectionAction,
  uploadCollectionImageAction,
  assignProductCollectionAction,
} from '@/lib/admin-actions';
import { prisma } from '@/lib/prisma';

const STATUSES = ['BORRADOR', 'PROXIMA', 'ACTIVA', 'AGOTADA', 'OCULTA', 'PRIVADA_DROP'];
const inp = 'rounded border border-border bg-background px-2 py-1.5 text-foreground';

export default async function AdminColecciones() {
  const [collections, products] = await Promise.all([
    prisma.collection.findMany({
      include: { products: { select: { id: true, name: true } }, _count: { select: { products: true } } },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.product.findMany({ select: { id: true, name: true, collectionId: true }, orderBy: { name: 'asc' } }),
  ]);
  const unassigned = products.filter((p) => !p.collectionId);

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl font-bold text-foreground">Colecciones</h1>

      {/* Crear */}
      <form action={createCollectionAction} className="mt-4 flex flex-wrap items-end gap-3 rounded-card border border-border bg-surface p-4">
        <label className="block"><span className="text-xs text-muted">Nombre</span>
          <input name="name" required className={`mt-1 w-48 ${inp}`} /></label>
        <label className="block"><span className="text-xs text-muted">Estado</span>
          <select name="status" className={`mt-1 ${inp}`}>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
        <button className="bevel bg-gold px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#1a1408]">Crear colección</button>
      </form>

      <div className="mt-6 space-y-4">
        {collections.map((c) => (
          <div key={c.id} className="rounded-card border border-border bg-surface p-4">
            <div className="flex flex-wrap items-start gap-4">
              {/* Imagen */}
              <div className="w-28 shrink-0">
                {c.imageUrl ? (
                  <img src={c.imageUrl} alt={c.name} className="h-20 w-28 rounded border border-border object-cover" />
                ) : (
                  <div className="flex h-20 w-28 items-center justify-center rounded border border-dashed border-border text-[10px] text-faint">sin imagen</div>
                )}
                <form action={uploadCollectionImageAction} className="mt-1">
                  <input type="hidden" name="collectionId" value={c.id} />
                  <input type="file" name="file" accept="image/*" className="block w-28 text-[10px] text-muted" />
                  <button className="mt-1 w-full border border-gold/40 py-1 text-[10px] uppercase text-gold-light">Subir</button>
                </form>
              </div>

              {/* Datos + estado */}
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-lg text-foreground">{c.name}</span>
                  <span className="font-mono text-[11px] text-faint">/{c.slug} · {c._count.products} piezas</span>
                </div>
                <form action={updateCollectionAction} className="mt-2 flex items-center gap-2">
                  <input type="hidden" name="id" value={c.id} />
                  <select name="status" defaultValue={c.status} className={`text-sm ${inp}`}>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
                  <button className="border border-gold/40 px-3 py-1.5 text-xs uppercase tracking-wider text-gold-light hover:bg-surface-elevated">Guardar</button>
                  {c._count.products === 0 ? (
                    <button formAction={deleteCollectionAction} className="border border-red-500/40 px-3 py-1.5 text-xs uppercase tracking-wider text-red-400">Borrar</button>
                  ) : null}
                </form>

                {/* Productos asignados */}
                <div className="mt-3">
                  <p className="text-xs text-muted">Monedas asignadas:</p>
                  {c.products.length === 0 ? <p className="text-xs text-faint">ninguna</p> : (
                    <ul className="mt-1 space-y-1">
                      {c.products.map((pr) => (
                        <li key={pr.id} className="flex items-center justify-between gap-2 text-sm">
                          <span className="text-foreground">{pr.name}</span>
                          <form action={assignProductCollectionAction}>
                            <input type="hidden" name="productId" value={pr.id} />
                            <input type="hidden" name="collectionId" value="" />
                            <button className="text-[11px] text-red-400 hover:underline">quitar</button>
                          </form>
                        </li>
                      ))}
                    </ul>
                  )}
                  {/* Asignar una pieza sin colección */}
                  {unassigned.length > 0 ? (
                    <form action={assignProductCollectionAction} className="mt-2 flex items-center gap-2">
                      <input type="hidden" name="collectionId" value={c.id} />
                      <select name="productId" className={`text-xs ${inp}`}>
                        {unassigned.map((pr) => <option key={pr.id} value={pr.id}>{pr.name}</option>)}
                      </select>
                      <button className="border border-gold/40 px-2 py-1 text-[11px] uppercase text-gold-light">Asignar</button>
                    </form>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
