import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import {
  updateProductAction,
  deleteProductAction,
  uploadProductImageAction,
  deleteProductImageAction,
  uploadProductVideoAction,
  updateProductTranslationAction,
} from '@/lib/admin-actions';
import { ConfirmButton } from '@/components/admin/confirm-button';
import { productImg } from '@/lib/img';

const LOCALES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'it', label: 'Italiano' },
] as const;

// Opciones de atributos de moneda (ref. plugin Legacy Woo Tools).
const PRODUCT_TYPES = [
  ['coin', 'Moneda'], ['ingot', 'Lingote'], ['blind_box', 'Blind Box'], ['pack', 'Pack'], ['other', 'Otro'],
];
const QUALITIES = [
  ['proof', 'Proof (Fondo Espejo)'], ['reverse_proof', 'Reverse Proof'], ['matte', 'Matte (Mate)'],
  ['antique', 'Antique (Acabado Antiguo)'], ['black_proof', 'Black Proof'],
];
const COIN_FEATURES = [
  ['high_relief', 'High Relief'], ['uhr', 'Ultra High Relief'], ['digital_printing', 'Color Digital'],
  ['selective_gilding', 'Baño de Oro Selectivo'], ['rhodium_ruthenium', 'Rhodium / Ruthenium'], ['glow_dark', 'Glow in the Dark'],
  ['color_changing', 'Termocrómico'], ['hologram', 'Holograma'], ['latent_image', 'Imagen Latente'],
  ['laser_frosting', 'Satinado Láser'], ['gemstone_inlay', 'Gemas / Cristales'], ['meteorite_insert', 'Meteorito / Artefacto'],
  ['shape_coin', 'Moneda con Forma'], ['bimetal', 'Bimetálica'], ['filigree', 'Filigrana'], ['incuse', 'Relieve Incuso'],
  ['edge_lettering', 'Grabado en el Canto'], ['microtext', 'Microtexto'], ['moving_elements', 'Elementos Móviles'],
  ['enamel_inlay', 'Esmalte'],
];

const inp = 'mt-1 w-full rounded border border-border bg-background px-2 py-1.5 text-foreground';
const money = (c: number) => (c / 100).toFixed(2);

export default async function ProductoDetalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, collections] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { images: { orderBy: { sortOrder: 'asc' } }, translations: true } }),
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
                  <img src={productImg(img.id, true)} alt={img.alt ?? ''} className="h-full w-full object-cover" />
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

      {/* Traducciones (nombre y descripción por idioma) */}
      <section className="mt-4 rounded-card border border-border bg-surface p-5">
        <h2 className="font-display text-lg text-gold-light">Traducciones</h2>
        <p className="mt-1 text-[11px] text-faint">Nombre y descripción por idioma. Vacío = se usa el nombre base «{p.name}».</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {LOCALES.map((loc) => {
            const tr = p.translations.find((t) => t.locale === loc.code);
            return (
              <form key={loc.code} action={updateProductTranslationAction} className="rounded border border-border p-3">
                <input type="hidden" name="productId" value={p.id} />
                <input type="hidden" name="locale" value={loc.code} />
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-faint">{loc.label}</span>
                  <button className="rounded border border-gold/40 px-2 py-1 text-[11px] uppercase tracking-wider text-gold-light hover:bg-surface-elevated">Guardar</button>
                </div>
                <input name="name" defaultValue={tr?.name ?? ''} placeholder="Nombre" className={inp} />
                <textarea name="description" defaultValue={tr?.description ?? ''} rows={2} placeholder="Descripción" className={`${inp} mt-2`} />
              </form>
            );
          })}
        </div>
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
          <h2 className="font-display text-lg text-gold-light">Atributos de moneda</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="block"><span className="text-xs text-muted">Tipo</span>
              <select name="productType" defaultValue={p.productType ?? ''} className={inp}>
                <option value="">—</option>
                {PRODUCT_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select></label>
            <label className="block"><span className="text-xs text-muted">Pureza</span><input name="purity" defaultValue={p.purity ?? ''} placeholder=".999" className={inp} /></label>
            <label className="block"><span className="text-xs text-muted">Unidades totales</span><input name="totalUnits" type="number" defaultValue={p.totalUnits ?? ''} className={inp} /></label>
            <label className="block"><span className="text-xs text-muted">Calidad</span>
              <select name="quality" defaultValue={p.quality ?? ''} className={inp}>
                <option value="">—</option>
                {QUALITIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select></label>
            <label className="block"><span className="text-xs text-muted">País</span><input name="country" defaultValue={p.country ?? ''} placeholder="España" className={inp} /></label>
            <label className="block"><span className="text-xs text-muted">Valor facial</span><input name="faceValue" defaultValue={p.faceValue ?? ''} placeholder="100 EUR" className={inp} /></label>
            <label className="block"><span className="text-xs text-muted">Etiqueta especial</span><input name="specialLabel" defaultValue={p.specialLabel ?? ''} placeholder="Exclusiva" className={inp} /></label>
            <label className="block"><span className="text-xs text-muted">IP / Licencia</span><input name="ipLicense" defaultValue={p.ipLicense ?? ''} placeholder="Real Madrid" className={inp} /></label>
            <label className="flex items-center gap-2 pt-5 text-sm text-muted"><input type="checkbox" name="limitedEdition" defaultChecked={p.limitedEdition} /> Edición limitada</label>
            <label className="block"><span className="text-xs text-muted">Certificado (CoA)</span><input name="coa" defaultValue={p.coa ?? ''} placeholder="Certificado numerado" className={inp} /></label>
            <label className="block"><span className="text-xs text-muted">Caja</span><input name="boxInfo" defaultValue={p.boxInfo ?? ''} placeholder="Caja exclusiva" className={inp} /></label>
            <label className="block"><span className="text-xs text-muted">Cápsula</span><input name="capsule" defaultValue={p.capsule ?? ''} placeholder="Cápsula premium" className={inp} /></label>
          </div>
          <label className="mt-3 block"><span className="text-xs text-muted">Incluye / Beneficios (uno por línea)</span>
            <textarea name="features" defaultValue={(p.features ?? []).join('\n')} rows={3} className={inp} /></label>
          <div className="mt-4">
            <span className="text-xs text-muted">Acabados técnicos</span>
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
              {COIN_FEATURES.map(([v, l]) => (
                <label key={v} className="flex items-center gap-2 text-[13px] text-muted">
                  <input type="checkbox" name="coinFeatures" value={v} defaultChecked={(p.coinFeatures ?? []).includes(v)} /> {l}
                </label>
              ))}
            </div>
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
          <ConfirmButton
            action={deleteProductAction}
            label="Borrar"
            confirmText="¿Borrar este producto? No se puede deshacer."
            className="border border-red-500/40 px-4 py-3 text-xs uppercase tracking-wider text-red-400 hover:bg-surface-elevated"
          />
        </div>
      </form>
    </div>
  );
}
