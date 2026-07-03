import {
  createCollectionAction,
  updateCollectionAction,
  deleteCollectionAction,
  uploadCollectionImageAction,
  addCollectionImagesAction,
  addCollectionVideoAction,
  deleteCollectionMediaAction,
  assignProductCollectionAction,
} from '@/lib/admin-actions';
import { ConfirmButton } from '@/components/admin/confirm-button';
import { prisma } from '@/lib/prisma';
import { collectionImg, collectionMediaImg } from '@/lib/img';

export const dynamic = 'force-dynamic';

const STATUSES = ['BORRADOR', 'PROXIMA', 'ACTIVA', 'AGOTADA', 'OCULTA', 'PRIVADA_DROP'];
const inp = 'rounded border border-border bg-background px-2 py-1.5 text-foreground';

/** Un vídeo se puede previsualizar inline si es un fichero (Volume o .mp4/.webm/.mov). */
function isFileVideo(url: string): boolean {
  return url.startsWith('/api/media') || /\.(mp4|webm|mov)(\?.*)?$/i.test(url);
}

export default async function AdminColecciones() {
  const [collections, products] = await Promise.all([
    prisma.collection.findMany({
      // Sin imageUrl (data URI): se sirve por /api/img. Se traen los ids de media
      // (y url solo para los vídeos, que se necesitan para la previsualización).
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        status: true,
        sortOrder: true,
        updatedAt: true,
        imageUrl: true,
        products: { select: { id: true, name: true } },
        media: { select: { id: true, kind: true, url: true }, orderBy: { sortOrder: 'asc' } },
        _count: { select: { products: true } },
      },
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
        {collections.map((c) => {
          const galleryImages = c.media.filter((m) => m.kind === 'IMAGE');
          const videos = c.media.filter((m) => m.kind === 'VIDEO');
          return (
          <div key={c.id} className="rounded-card border border-border bg-surface p-4">
            <div className="flex flex-wrap items-start gap-4">
              {/* Portada */}
              <div className="w-28 shrink-0">
                {c.imageUrl ? (
                  <img src={collectionImg(c.id, c.updatedAt, true)} alt={c.name} className="h-20 w-28 rounded border border-border object-cover" />
                ) : (
                  <div className="flex h-20 w-28 items-center justify-center rounded border border-dashed border-border text-[10px] text-faint">sin portada</div>
                )}
                <form action={uploadCollectionImageAction} className="mt-1">
                  <input type="hidden" name="collectionId" value={c.id} />
                  <input type="file" name="file" accept="image/*" className="block w-28 text-[10px] text-muted" />
                  <button className="mt-1 w-full border border-gold/40 py-1 text-[10px] uppercase text-gold-light">Portada</button>
                </form>
              </div>

              {/* Datos + estado */}
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-lg text-foreground">{c.name}</span>
                  <span className="font-mono text-[11px] text-faint">/{c.slug} · {c._count.products} piezas</span>
                </div>
                <form action={updateCollectionAction} className="mt-2 flex flex-wrap items-center gap-2">
                  <input type="hidden" name="id" value={c.id} />
                  <select name="status" defaultValue={c.status} className={`text-sm ${inp}`}>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
                  <button className="border border-gold/40 px-3 py-1.5 text-xs uppercase tracking-wider text-gold-light hover:bg-surface-elevated">Guardar estado</button>
                  {c._count.products === 0 ? (
                    <ConfirmButton
                      action={deleteCollectionAction}
                      label="Borrar"
                      confirmText={`¿Borrar la colección «${c.name}»? No se puede deshacer.`}
                      className="border border-red-500/40 px-3 py-1.5 text-xs uppercase tracking-wider text-red-400 hover:bg-red-500/10"
                    />
                  ) : null}
                </form>

                {/* Galería de fotos */}
                <div className="mt-4 rounded border border-border/60 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gold-light">Galería de fotos ({galleryImages.length})</p>
                  {galleryImages.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {galleryImages.map((m) => (
                        <div key={m.id} className="relative">
                          <img src={collectionMediaImg(m.id, true)} alt="" className="h-16 w-16 rounded border border-border object-cover" />
                          <form action={deleteCollectionMediaAction} className="absolute -right-1 -top-1">
                            <input type="hidden" name="mediaId" value={m.id} />
                            <button className="grid h-5 w-5 place-items-center rounded-full border border-red-500/50 bg-black/70 text-[10px] text-red-300 hover:bg-red-500/20" title="Eliminar">✕</button>
                          </form>
                        </div>
                      ))}
                    </div>
                  ) : <p className="mt-1 text-[11px] text-faint">Sin fotos adicionales.</p>}
                  <form action={addCollectionImagesAction} className="mt-2 flex flex-wrap items-center gap-2">
                    <input type="hidden" name="collectionId" value={c.id} />
                    <input type="file" name="files" accept="image/*" multiple className="text-[11px] text-muted" />
                    <button className="border border-gold/40 px-2 py-1 text-[10px] uppercase text-gold-light">Añadir fotos</button>
                  </form>
                </div>

                {/* Vídeos */}
                <div className="mt-3 rounded border border-border/60 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gold-light">Vídeos ({videos.length})</p>
                  {videos.length > 0 ? (
                    <div className="mt-2 space-y-2">
                      {videos.map((m) => (
                        <div key={m.id} className="flex flex-wrap items-center gap-3 rounded border border-border/50 bg-background/40 p-2">
                          {isFileVideo(m.url) ? (
                            // eslint-disable-next-line jsx-a11y/media-has-caption
                            <video src={m.url} controls preload="metadata" className="h-24 rounded border border-border bg-black" />
                          ) : (
                            <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-xs text-gold-light underline">
                              Abrir vídeo externo ↗
                            </a>
                          )}
                          <span className="max-w-[200px] truncate font-mono text-[10px] text-faint">{m.url}</span>
                          <form action={deleteCollectionMediaAction} className="ml-auto">
                            <input type="hidden" name="mediaId" value={m.id} />
                            <button className="text-[11px] text-red-400 hover:underline">Eliminar</button>
                          </form>
                        </div>
                      ))}
                    </div>
                  ) : <p className="mt-1 text-[11px] text-faint">Sin vídeos.</p>}
                  {/* Añadir por URL */}
                  <form action={addCollectionVideoAction} className="mt-2 flex flex-wrap items-center gap-2">
                    <input type="hidden" name="collectionId" value={c.id} />
                    <input name="url" type="url" placeholder="URL (YouTube, Vimeo o .mp4)" className={`flex-1 min-w-[220px] text-sm ${inp}`} />
                    <button className="border border-gold/40 px-2 py-1 text-[10px] uppercase text-gold-light">Añadir URL</button>
                  </form>
                  {/* Añadir subiendo archivo */}
                  <form action={addCollectionVideoAction} className="mt-2 flex flex-wrap items-center gap-2">
                    <input type="hidden" name="collectionId" value={c.id} />
                    <input type="file" name="file" accept="video/*" className="text-[11px] text-muted" />
                    <button className="border border-gold/40 px-2 py-1 text-[10px] uppercase text-gold-light">Subir vídeo (máx. 60 MB)</button>
                  </form>
                </div>

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
          );
        })}
      </div>
    </div>
  );
}
