import { NextResponse, type NextRequest } from 'next/server';
import { readMedia } from '@/lib/storage';

export const runtime = 'nodejs';

// Sirve imágenes y vídeos subidos al directorio de uploads (Railway Volume en
// prod). Para vídeo implementa peticiones Range (206 Partial Content): sin ello
// muchos navegadores (Safari/iOS y ficheros grandes en Chrome) no reproducen ni
// permiten buscar en la barra de tiempo.
export async function GET(req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const media = await readMedia(name);
  if (!media) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const { body, contentType } = media;
  const total = body.length;
  const base: Record<string, string> = {
    'Content-Type': contentType,
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Accept-Ranges': 'bytes',
  };

  const range = req.headers.get('range');
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    let start = m && m[1] ? parseInt(m[1], 10) : 0;
    let end = m && m[2] ? parseInt(m[2], 10) : total - 1;
    if (Number.isNaN(start) || start < 0) start = 0;
    if (Number.isNaN(end) || end >= total) end = total - 1;
    if (start > end) {
      return new NextResponse(null, { status: 416, headers: { ...base, 'Content-Range': `bytes */${total}` } });
    }
    const chunk = body.subarray(start, end + 1);
    return new NextResponse(chunk as unknown as BodyInit, {
      status: 206,
      headers: { ...base, 'Content-Range': `bytes ${start}-${end}/${total}`, 'Content-Length': String(chunk.length) },
    });
  }

  return new NextResponse(body as unknown as BodyInit, {
    status: 200,
    headers: { ...base, 'Content-Length': String(total) },
  });
}
