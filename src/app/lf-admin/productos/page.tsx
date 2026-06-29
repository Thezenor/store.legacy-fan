import { prisma } from '@/lib/prisma';
import { createProductAction, updateProductAction } from '@/lib/admin-actions';

export default async function AdminProductos() {
  const [products, collections] = await Promise.all([
    prisma.product.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
    prisma.collection.findMany({ orderBy: { name: 'asc' } }),
  ]);

  const checkboxes = [
    { name: 'includedInPrime', label: 'Prime' },
    { name: 'includedInPrestige', label: 'Prestige' },
    { name: 'isInauguralCoin', label: 'Inaugural' },
    { name: 'available', label: 'Disponible' },
    { name: 'visible', label: 'Visible' },
  ] as const;

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-foreground">Productos</h1>
      <p className="mt-1 text-sm text-muted">
        Precios y premium en EUR/USD. “Incluido” genera el producto en el pedido del socio (M6);
        “Inaugural” lo habilita para el upsell (Prestige).
      </p>

      {/* Crear */}
      <form action={createProductAction} className="mt-4 space-y-3 rounded-card border border-border bg-surface p-4">
        <div className="flex flex-wrap gap-3">
          <label className="block"><span className="text-xs text-muted">Nombre</span>
            <input name="name" required className="mt-1 w-56 rounded border border-border bg-background px-2 py-1.5 text-foreground" /></label>
          <label className="block"><span className="text-xs text-muted">Slug (opcional)</span>
            <input name="slug" className="mt-1 w-40 rounded border border-border bg-background px-2 py-1.5 text-foreground" /></label>
          <label className="block"><span className="text-xs text-muted">Colección</span>
            <select name="collectionId" className="mt-1 rounded border border-border bg-background px-2 py-1.5 text-foreground">
              <option value="">—</option>
              {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></label>
        </div>
        <div className="flex flex-wrap gap-3">
          {(['priceEur', 'priceUsd', 'premiumEur', 'premiumUsd'] as const).map((f) => (
            <label key={f} className="block"><span className="text-xs text-muted">{f}</span>
              <input name={f} type="number" step="0.01" defaultValue="0" className="mt-1 w-28 rounded border border-border bg-background px-2 py-1.5 text-foreground" /></label>
          ))}
        </div>
        <div className="flex flex-wrap gap-4">
          {checkboxes.map((c) => (
            <label key={c.name} className="flex items-center gap-2 text-sm text-muted">
              <input type="checkbox" name={c.name} defaultChecked={c.name === 'available' || c.name === 'visible'} /> {c.label}
            </label>
          ))}
        </div>
        <button type="submit" className="rounded bg-gold-grad px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#160f02]">
          Crear producto
        </button>
      </form>

      {/* Listado editable */}
      <div className="mt-6 space-y-3">
        {products.length === 0 ? (
          <p className="text-sm text-muted">Aún no hay productos.</p>
        ) : (
          products.map((p) => (
            <form key={p.id} action={updateProductAction} className="space-y-2 rounded-card border border-border bg-surface p-4">
              <input type="hidden" name="id" value={p.id} />
              <div className="flex items-center justify-between">
                <span className="text-foreground">{p.name} <span className="font-mono text-[11px] text-faint">/{p.slug}</span></span>
                <button type="submit" className="rounded border border-gold/40 px-3 py-1.5 text-xs uppercase tracking-wider text-gold-light hover:bg-surface-elevated">Guardar</button>
              </div>
              <div className="flex flex-wrap gap-3">
                <label className="block"><span className="text-xs text-muted">priceEur</span>
                  <input name="priceEur" type="number" step="0.01" defaultValue={(p.priceEurCents/100).toFixed(2)} className="mt-1 w-24 rounded border border-border bg-background px-2 py-1 text-foreground" /></label>
                <label className="block"><span className="text-xs text-muted">priceUsd</span>
                  <input name="priceUsd" type="number" step="0.01" defaultValue={(p.priceUsdCents/100).toFixed(2)} className="mt-1 w-24 rounded border border-border bg-background px-2 py-1 text-foreground" /></label>
                <label className="block"><span className="text-xs text-muted">premiumEur</span>
                  <input name="premiumEur" type="number" step="0.01" defaultValue={(p.premiumEurCents/100).toFixed(2)} className="mt-1 w-24 rounded border border-border bg-background px-2 py-1 text-foreground" /></label>
                <label className="block"><span className="text-xs text-muted">premiumUsd</span>
                  <input name="premiumUsd" type="number" step="0.01" defaultValue={(p.premiumUsdCents/100).toFixed(2)} className="mt-1 w-24 rounded border border-border bg-background px-2 py-1 text-foreground" /></label>
              </div>
              <div className="flex flex-wrap gap-4">
                {checkboxes.map((c) => (
                  <label key={c.name} className="flex items-center gap-2 text-sm text-muted">
                    <input type="checkbox" name={c.name} defaultChecked={(p as Record<string, unknown>)[c.name] as boolean} /> {c.label}
                  </label>
                ))}
              </div>
            </form>
          ))
        )}
      </div>
    </div>
  );
}
