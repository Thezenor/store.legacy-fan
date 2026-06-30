import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';

// Directorio de subidas. En Railway, monta un Volume y pon UPLOAD_DIR=/data/uploads.
// En local, por defecto ./uploads (persistente entre recargas de dev).
const DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

const EXT_OK = new Set(['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'mp4', 'webm', 'mov']);
const CONTENT_TYPE: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
  webp: 'image/webp', avif: 'image/avif', gif: 'image/gif',
  mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
};
const VIDEO = new Set(['mp4', 'webm', 'mov']);

// Anchos de las variantes optimizadas.
const DESKTOP_W = 1280;
const MOBILE_W = 640;

export interface SavedUpload {
  name: string;
  /** Variante de escritorio (o el original si no se pudo optimizar). */
  url: string;
  /** Variante móvil (WebP más ligero), si se generó. */
  urlMobile?: string;
}

/**
 * Guarda un fichero subido. Para IMÁGENES genera variantes optimizadas en WebP:
 * una de escritorio (≤1280px) y otra de móvil (≤640px), reduciendo mucho el peso.
 * Para vídeo guarda el original. Si la optimización falla, guarda el original.
 */
export async function saveUpload(file: File): Promise<SavedUpload> {
  const ext = (file.name.split('.').pop() ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!EXT_OK.has(ext)) throw new Error('Formato no soportado.');
  const maxMb = VIDEO.has(ext) ? 60 : 15;
  if (file.size > maxMb * 1024 * 1024) throw new Error(`El archivo supera ${maxMb} MB.`);

  await mkdir(DIR, { recursive: true });
  const rand = randomBytes(10).toString('hex');
  const input = Buffer.from(await file.arrayBuffer());

  // Vídeo: se guarda tal cual.
  if (VIDEO.has(ext)) {
    const name = `${rand}.${ext}`;
    await writeFile(path.join(DIR, name), input);
    return { name, url: `/api/media/${name}` };
  }

  // Imagen: optimizar a WebP (escritorio + móvil).
  try {
    const sharp = (await import('sharp')).default;
    const base = sharp(input, { animated: ext === 'gif' }).rotate(); // respeta orientación EXIF
    const [desktop, mobile] = await Promise.all([
      base.clone().resize({ width: DESKTOP_W, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer(),
      base.clone().resize({ width: MOBILE_W, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer(),
    ]);
    const nameD = `${rand}.webp`;
    const nameM = `${rand}-m.webp`;
    await Promise.all([
      writeFile(path.join(DIR, nameD), desktop),
      writeFile(path.join(DIR, nameM), mobile),
    ]);
    return { name: nameD, url: `/api/media/${nameD}`, urlMobile: `/api/media/${nameM}` };
  } catch {
    // Fallback: guardar el original sin optimizar.
    const name = `${rand}.${ext}`;
    await writeFile(path.join(DIR, name), input);
    return { name, url: `/api/media/${name}` };
  }
}

/**
 * Optimiza una imagen y la devuelve como data URI WebP (para guardarla en BD,
 * sin depender del Volume; ideal para imágenes pequeñas como las monedas).
 */
export async function optimizeImageToDataUri(file: File, maxWidth = 512): Promise<string> {
  const input = Buffer.from(await file.arrayBuffer());
  const sharp = (await import('sharp')).default;
  const out = await sharp(input)
    .rotate()
    .resize({ width: maxWidth, height: maxWidth, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
  return `data:image/webp;base64,${out.toString('base64')}`;
}

/** Lee un fichero servible por su nombre (con guarda anti-traversal). */
export async function readMedia(name: string): Promise<{ body: Buffer; contentType: string } | null> {
  if (!/^[a-zA-Z0-9_-]+\.[a-z0-9]+$/.test(name)) return null; // nombre seguro (sin / ni ..)
  const ext = name.split('.').pop()!.toLowerCase();
  try {
    const body = await readFile(path.join(DIR, name));
    return { body, contentType: CONTENT_TYPE[ext] ?? 'application/octet-stream' };
  } catch {
    return null;
  }
}
