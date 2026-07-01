// Migra imágenes guardadas en el Volume (/api/media/...) a DATA URI en la BD,
// para que NO haya que re-subirlas y sobrevivan a los redeploys.
// Idempotente: solo procesa URLs /api/media; las data: se dejan igual.
// Se ejecuta en el arranque de Railway (startCommand), donde el Volume está
// montado y el fichero aún existe. Si el fichero ya no está, se deja la URL tal
// cual (no se puede recuperar; habría que re-subir esa imagen concreta).
import { PrismaClient } from '@prisma/client';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const prisma = new PrismaClient();
const DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const CT = { webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', avif: 'image/avif', gif: 'image/gif' };

async function toDataUri(url) {
  if (!url || !url.startsWith('/api/media/')) return null; // ya es data: o externa
  const name = url.slice('/api/media/'.length);
  if (!/^[a-zA-Z0-9_-]+\.[a-z0-9]+$/.test(name)) return null;
  const ext = name.split('.').pop().toLowerCase();
  if (!CT[ext]) return null; // no convertimos vídeo a data URI
  try {
    const buf = await readFile(path.join(DIR, name));
    return `data:${CT[ext]};base64,${buf.toString('base64')}`;
  } catch {
    return null; // el fichero ya no está en el Volume
  }
}

async function run() {
  let migrated = 0;
  let missing = 0;

  // ProductImage.url / urlMobile
  const imgs = await prisma.productImage.findMany({ where: { url: { startsWith: '/api/media/' } } });
  for (const im of imgs) {
    const url = await toDataUri(im.url);
    const urlMobile = im.urlMobile ? await toDataUri(im.urlMobile) : null;
    if (url) {
      await prisma.productImage.update({ where: { id: im.id }, data: { url, urlMobile: urlMobile ?? im.urlMobile } });
      migrated++;
    } else {
      missing++;
    }
  }

  // Collection.imageUrl / imageUrlMobile
  const cols = await prisma.collection.findMany({ where: { imageUrl: { startsWith: '/api/media/' } } });
  for (const c of cols) {
    const imageUrl = await toDataUri(c.imageUrl);
    const imageUrlMobile = c.imageUrlMobile ? await toDataUri(c.imageUrlMobile) : null;
    if (imageUrl) {
      await prisma.collection.update({ where: { id: c.id }, data: { imageUrl, imageUrlMobile: imageUrlMobile ?? c.imageUrlMobile } });
      migrated++;
    } else {
      missing++;
    }
  }

  console.log(`[backfill-media] migradas a BD: ${migrated} · no recuperables (fichero ausente): ${missing}`);
}

run()
  .catch((e) => {
    console.error('[backfill-media] error (no bloqueante):', e?.message ?? e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
