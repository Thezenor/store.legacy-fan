import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';

// Directorio de subidas. En Railway, monta un Volume y pon UPLOAD_DIR=/data/uploads.
// En local, por defecto ./uploads (persistente entre recargas de dev).
const DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

const EXT_OK = new Set(['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif']);
const CONTENT_TYPE: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
  webp: 'image/webp', avif: 'image/avif', gif: 'image/gif',
};

/** Guarda un fichero subido y devuelve { name, url }. Solo imágenes. */
export async function saveUpload(file: File): Promise<{ name: string; url: string }> {
  const ext = (file.name.split('.').pop() ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!EXT_OK.has(ext)) throw new Error('Formato de imagen no soportado.');
  if (file.size > 8 * 1024 * 1024) throw new Error('La imagen supera 8 MB.');

  await mkdir(DIR, { recursive: true });
  const name = `${randomBytes(10).toString('hex')}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(DIR, name), bytes);
  return { name, url: `/api/media/${name}` };
}

/** Lee un fichero servible por su nombre (con guarda anti-traversal). */
export async function readMedia(name: string): Promise<{ body: Buffer; contentType: string } | null> {
  if (!/^[a-f0-9]+\.[a-z0-9]+$/i.test(name)) return null; // nombre seguro
  const ext = name.split('.').pop()!.toLowerCase();
  try {
    const body = await readFile(path.join(DIR, name));
    return { body, contentType: CONTENT_TYPE[ext] ?? 'application/octet-stream' };
  } catch {
    return null;
  }
}
