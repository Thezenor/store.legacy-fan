// Helpers para servir imágenes guardadas en BD (data URIs) a través de una
// ruta cacheable /api/img/... en vez de incrustarlas en el HTML. Reduce el
// peso de las páginas y permite cachear la imagen en navegador/CDN.

const ver = (d?: Date | null) => (d ? `?v=${d.getTime()}` : '');

/** Imagen de una pieza (ProductImage). El id cambia al re-subir → inmutable. */
export function productImg(id: string, mobile = false): string {
  return `/api/img/p/${id}${mobile ? '?m=1' : ''}`;
}

/** Imagen de una colección (cache-bust por updatedAt). */
export function collectionImg(id: string, updatedAt?: Date | null, mobile = false): string {
  const v = ver(updatedAt);
  return `/api/img/c/${id}${v}${v ? (mobile ? '&m=1' : '') : mobile ? '?m=1' : ''}`;
}

/** Imagen de galería de colección (CollectionMedia). Id inmutable. */
export function collectionMediaImg(id: string, mobile = false): string {
  return `/api/img/m/${id}${mobile ? '?m=1' : ''}`;
}

/** Imagen guardada en un SystemSetting (p. ej. upsell.coin.a.image). */
export function settingImg(key: string, updatedAt?: Date | null): string {
  return `/api/img/s/${encodeURIComponent(key)}${ver(updatedAt)}`;
}
