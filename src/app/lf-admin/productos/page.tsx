import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { createProductAction } from '@/lib/admin-actions';

const inp = 'mt-1 rounded border border-border bg-background px-2 py-1.5 text-foreground';

export default async function AdminProductos() {
  const [products, collections] = await Promise.all([
    prisma.product.findMany({ orderBy: { createdAt: 'desc' }, take: 200, include: { collection: true, images: { take: 1, orderBy: { sortOrder: 'asc' } } } }),
    prisma.collection.findMany({ orderBy: { name: 'asc' } }),
  ]);

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl font-bold text-foreground">Productos</h1>
      <p className="mt-1 text-sm text-muted">Crea una pieza y entra en ella para completar ficha, fotos e historia.</p>

      {/* Alta rápida */}
      <form action={createProductAction} className="mt-4 flex flex-wrap items-end gap-3 rounded-card border border-border bg-surface p-4">
        <label className="block"><span className="text-xs text-muted">Nombre</span>
          <input name="name" required className={`${inp} w-full sm:w-56`} /></label>
        <label className="block"><span className="text-xs text-muted">Slug (opcional)</span>
          <input name="slug" className={`${inp} w-40`} /></label>
        <label className="block"><span className="text-xs text-muted">Colección</span>
          <select name="collectionId" className={inp}>
            <option value="">—</option>
            {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select></label>
        {/* visible por defecto al crear */}
        <input type="hidden" name="visible" value="on" />
        <input type="hidden" name="available" value="on" />
        <button className="bevel bg-gold px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#1a1408]">Crear pieza</button>
      </form>

      {/* Listado */}
      <div className="mt-6 overflow-x-auto rounded-card border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wider text-faint">
            <tr><th className="px-4 py-3">Pieza</th><th className="px-4 py-3">Colección</th><th className="px-4 py-3">Metal</th><th className="px-4 py-3">Estado</th></tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-muted">Aún no hay productos.</td></tr>
            ) : products.map((p) => (
              <tr key={p.id} className="border-t border-border transition hover:bg-surface-elevated">
                <td className="px-4 py-3">
                  <Link href={`/lf-admin/productos/${p.id}`} className="flex items-center gap-2 text-gold-light hover:underline">
                    {/* miniatura si hay imagen */}
                    {p.images[0] ? <span className="h-6 w-6 overflow-hidden rounded-full border border-border"><img src={p.images[0].url} alt="" className="h-full w-full object-cover" /></span> : null}
                    {p.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted">{p.collection?.name ?? '—'}</td>
                <td className="px-4 py-3 text-muted">{p.metal ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-muted">{p.visible ? 'visible' : 'oculto'}{p.available ? '' : ' · no disp.'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
