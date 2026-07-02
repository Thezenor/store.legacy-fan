import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// Sirve imágenes almacenadas como data URI en BD (ProductImage, Collection,
// SystemSetting) decodificándolas a bytes con Cache-Control largo. Así el HTML
// deja de arrastrar ~100-500 KB de base64 por imagen y el navegador/CDN la
// cachea. Las URLs llevan versión (?v=updatedAt) o id inmutable para invalidar.

const YEAR = 'public, max-age=31536000, immutable';

async function resolveValue(kind: string, id: string, mobile: boolean): Promise<string | null> {
  if (kind === 'p') {
    const row = await prisma.productImage.findUnique({
      where: { id },
      select: { url: true, urlMobile: true },
    });
    if (!row) return null;
    return (mobile ? row.urlMobile : row.url) || row.url;
  }
  if (kind === 'c') {
    const row = await prisma.collection.findUnique({
      where: { id },
      select: { imageUrl: true, imageUrlMobile: true },
    });
    if (!row) return null;
    return (mobile ? row.imageUrlMobile : row.imageUrl) || row.imageUrl;
  }
  if (kind === 's') {
    const row = await prisma.systemSetting.findUnique({ where: { key: id }, select: { value: true } });
    return row?.value == null ? null : String(row.value);
  }
  return null;
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await ctx.params;
  const mobile = new URL(req.url).searchParams.get('m') === '1';

  const value = await resolveValue(kind, decodeURIComponent(id), mobile);
  if (!value) return new NextResponse(null, { status: 404 });

  // Si no es data URI (URL externa o ruta antigua), redirige a ella.
  if (!value.startsWith('data:')) return NextResponse.redirect(new URL(value, req.url), 307);

  const match = /^data:([^;]+);base64,(.*)$/s.exec(value);
  if (!match) return new NextResponse(null, { status: 404 });
  const [, contentType, b64] = match;
  const body = Buffer.from(b64, 'base64');

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(body.length),
      'Cache-Control': YEAR,
    },
  });
}
