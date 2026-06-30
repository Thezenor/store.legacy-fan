import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import {
  updateProductAction,
  deleteProductAction,
  uploadProductImageAction,
  deleteProductImageAction,
  uploadProductVideoAction,
} from '@/lib/admin-actions';

const inp = 'mt-1 w-full rounded border border-border bg-background px-2 py-1.5 text-foreground';
const money = (c: number) => (c / 100).toFixed(2);

export default async function ProductoDetalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, collections] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { images: { orderBy: { sortOrder: 'asc' } } } }),
    prisma.collection.findMany({ orderBy: { name: 'asc' } }),
  ]);
  if (!product) notFound();
  const p = product;
  const flags = [
    { n: 'includedInPrime', l: 'Incluido en Prime', v: p.includedInPrime },
    { n: 'includedInPrestige', l: 'Incluido en Prestige', v: p.includedInPrestige },
    { n: 'isInauguralCoin', l: 'Moneda inaugural', v: p.isInauguralCoin },
    { n: 'certificateRequired', l: 'Requiere certificado', v: p.certificateRequired },
    { n: 'hasAuthenticityQr', l: 'QR de autenticidad', v: p.hasAuthenticityQr },
    { n: 'available', l: 'Disponible', v: p.available },
    { n: 'visible', l: 'Visible en web', v: p.visible },
  ];

  return (
    <div className="max-w-3xl">
      <Link href="/lf-admin/productos" className="text-sm text-muted hover:text-foreground">← Productos</Link>
      <h1 className="mt-2 font-display text-3xl font-bold text-foreground">{p.name}</h1>
      <p className="mt-1 font-mono text-xs text-faint">/{p.slug}</p>

      {/* Galería de fotos */}
      <section className="mt-4 rounded-card border border-border bg-surface p-5">
        <h2 className="font-display text-lg text-gold-light">Fotografías</h2>
        {p.images.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Sin imágenes todavía.</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-3">
            {p.images.map((img) => (
              <div key={img.id} className="relative">
                <span className="block h-24 w-24 overflow-hidden rounded border border-border">
                  <img src={img.url} alt={img.alt ?? ''} className="h-full w-full object-cover" />
                </span>
                <form action={deleteProductImageAction}>
                  <input type="hidden" name="imageId" value={img.id} />
                  <button className="mt-1 w-full text-[11px] text-red-400 hover:underline">Borrar</button>
                </form>
              </div>
            ))}
          </div>
        )}
        {/* Subida (multipart vía server action) */}
        <form action={uploadProductImageAction} className="mt-4 flex flex-wrap items-end gap-3 border-t border-border pt-4">
          <input type="hidden" name="productId" value={p.id} />
          <label className="block"><span className="text-xs text-muted">Subir imagen (JPG/PNG/WebP, máx 8MB)</span>
            <input type="file" name="file" accept="image/*" required className="mt-1 block text-sm text-muted" /></label>
          <label className="block flex-1"><span className="text-xs text-muted">Texto alternativo</span>
            <input name="alt" className={inp} /></label>
          <button className="bevel bg-gold px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#1a1408]">Subir</button>
        </form>
      </section>

      {/* Vídeo */}
      <section className="mt-4 rounded-card border border-border bg-surface p-5">
        <h2 className="font-display text-lg text-gold-light">Vídeo</h2>
        {p.videoUrl ? (
          <video src={p.videoUrl} controls className="mt-3 max-h-64 rounded border border-border" />
        ) : (
          <p className="mt-2 text-sm text-muted">Sin vídeo.</p>
        )}
        <form action={uploadProductVideoAction} className="mt-3 flex flex-wrap items-end gap-3 border-t border-border pt-3">
          <input type="hidden" name="productId" value={p.id} />
          <label className="block"><span className="text-xs text-muted">Subir vídeo (MP4/WebM, máx 60MB)</span>
            <input type="file" name="file" accept="video/*" required className="mt-1 block text-sm text-muted" /></label>
          <button className="bevel bg-gold px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#1a1408]">Subir vídeo</button>
        </form>
      </section>

      {/* Ficha completa */}
      <form action={updateProductAction} className="mt-4 space-y-4">
        <input type="hidden" name="id" value={p.id} />

        <section className="rounded-card border border-border bg-surface p-5">
          <h2 className="font-display text-lg text-gold-light">Datos</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block"><span className="text-xs text-muted">Nombre</span><input name="name" defaultValue={p.name} className={inp} /></label>
            <label className="block"><span className="text-xs text-muted">Colección</span>
              <select name="collectionId" defaultValue={p.collectionId ?? ''} className={inp}>
                <option value="">—</option>
                {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select></label>
          </div>
          <label className="mt-3 block"><span className="text-xs text-muted">Descripción</span><textarea name="description" defaultValue={p.description ?? ''} rows={3} className={inp} /></label>
          <label className="mt-3 block"><span className="text-xs text-muted">Historia / lore</span><textarea name="history" defaultValue={p.history ?? ''} rows={4} className={inp} /></label>
        </section>

        <section className="rounded-card border border-border bg-surface p-5">
          <h2 className="font-display text-lg text-gold-light">Ficha técnica</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="block"><span className="text-xs text-muted">Metal</span><input name="metal" defaultValue={p.metal ?? ''} placeholder="Plata .999" className={inp} /></label>
            <label className="block"><span className="text-xs text-muted">Peso</span><input name="weightLabel" defaultValue={p.weightLabel ?? ''} placeholder="2 oz" className={inp} /></label>
            <label className="block"><span className="text-xs text-muted">Acabado</span><input name="finish" defaultValue={p.finish ?? ''} placeholder="Ultra High Relief" className={inp} /></label>
            <label className="block"><span className="text-xs text-muted">Diámetro</span><input name="diameter" defaultValue={p.diameter ?? ''} placeholder="50 mm" className={inp} /></label>
            <label className="block"><span className="text-xs text-muted">Tirada</span><input name="editionSize" type="number" defaultValue={p.editionSize ?? ''} className={inp} /></label>
            <label className="block"><span className="text-xs text-muted">Año</span><input name="mintYear" type="number" defaultValue={p.mintYear ?? ''} className={inp} /></label>
          </div>
        </section>

        <section className="rounded-card border border-border bg-surface p-5">
          <h2 className="font-display text-lg text-gold-light">Precios (€ / $)</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            <label className="block"><span className="text-xs text-muted">Precio EUR</span><input name="priceEur" type="number" step="0.01" defaultValue={money(p.priceEurCents)} className={inp} /></label>
            <label className="block"><span className="text-xs text-muted">Precio USD</span><input name="priceUsd" type="number" step="0.01" defaultValue={money(p.priceUsdCents)} className={inp} /></label>
            <label className="block"><span className="text-xs text-muted">Premium EUR</span><input name="premiumEur" type="number" step="0.01" defaultValue={money(p.premiumEurCents)} className={inp} /></label>
            <label className="block"><span className="text-xs text-muted">Premium USD</span><input name="premiumUsd" type="number" step="0.01" defaultValue={money(p.premiumUsdCents)} className={inp} /></label>
          </div>
          <p className="mt-2 text-xs text-faint">Recuerda: puntos y descuentos se calculan solo sobre el premium.</p>
        </section>

        <section className="rounded-card border border-border bg-surface p-5">
          <h2 className="font-display text-lg text-gold-light">Opciones</h2>
          <div className="mt-3 flex flex-wrap gap-4">
            {flags.map((f) => (
              <label key={f.n} className="flex items-center gap-2 text-sm text-muted">
                <input type="checkbox" name={f.n} defaultChecked={f.v} /> {f.l}
              </label>
            ))}
          </div>
        </section>

        <div className="flex gap-2">
          <button className="bevel bg-gold px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#1a1408]">Guardar producto</button>
          <button formAction={deleteProductAction} className="border border-red-500/40 px-4 py-3 text-xs uppercase tracking-wider text-red-400 hover:bg-surface-elevated">Borrar</button>
        </div>
      </form>
    </div>
  );
}
