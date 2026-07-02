import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { createProductAction, toggleProductFlagAction } from '@/lib/admin-actions';

const inp = 'mt-1 rounded border border-border bg-background px-2 py-1.5 text-foreground';

export default async function AdminProductos({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  // Selects ajustados: las imágenes son data URIs grandes; el listado solo
  // necesita la miniatura móvil y el nombre de la colección.
  const [products, collections, soldGroups] = await Promise.all([
    prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        collection: { select: { name: true } },
        images: { take: 1, orderBy: { sortOrder: 'asc' }, select: { url: true, urlMobile: true } },
      },
    }),
    prisma.collection.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.orderItem.groupBy({ by: ['productId'], _count: { _all: true }, where: { productId: { not: null } } }),
  ]);
  const sold = new Map(soldGroups.map((g) => [g.productId, g._count._all]));

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl font-bold text-foreground">Productos</h1>
      <p className="mt-1 text-sm text-muted">Crea una pieza y entra en ella para completar ficha, fotos e historia.</p>

      {saved ? (
        <p className="mt-3 rounded border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-300">
          ✓ Producto guardado correctamente.
        </p>
      ) : null}

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
            <tr>
              <th className="px-4 py-3">Pieza</th>
              <th className="px-4 py-3">Colección</th>
              <th className="px-4 py-3">Tirada</th>
              <th className="px-4 py-3">Vendidas</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-muted">Aún no hay productos.</td></tr>
            ) : products.map((p) => {
              const vendidas = sold.get(p.id) ?? 0;
              const stock = p.editionSize != null ? p.editionSize - vendidas : null;
              return (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <Link href={`/lf-admin/productos/${p.id}`} className="flex items-center gap-2 text-gold-light hover:underline">
                      {p.images[0] ? <span className="h-6 w-6 overflow-hidden rounded-full border border-border"><img src={p.images[0].urlMobile ?? p.images[0].url} alt="" className="h-full w-full object-cover" /></span> : null}
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{p.collection?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-muted">{p.editionSize ?? '—'}</td>
                  <td className="px-4 py-3 text-foreground">{vendidas}</td>
                  <td className={`px-4 py-3 ${stock != null && stock <= 0 ? 'text-red-400' : 'text-muted'}`}>{stock ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <form action={toggleProductFlagAction}>
                        <input type="hidden" name="id" value={p.id} /><input type="hidden" name="field" value="visible" />
                        <button className={`text-[11px] uppercase ${p.visible ? 'text-state-green' : 'text-faint'} hover:underline`}>{p.visible ? 'visible' : 'oculto'}</button>
                      </form>
                      <form action={toggleProductFlagAction}>
                        <input type="hidden" name="id" value={p.id} /><input type="hidden" name="field" value="available" />
                        <button className={`text-[11px] uppercase ${p.available ? 'text-state-green' : 'text-red-400'} hover:underline`}>{p.available ? 'disp.' : 'bloqueada'}</button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
