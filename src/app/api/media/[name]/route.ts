import { NextResponse } from 'next/server';
import { readMedia } from '@/lib/storage';

// Sirve imágenes subidas desde el directorio de uploads (Railway Volume en prod).
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const media = await readMedia(name);
  if (!media) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return new NextResponse(media.body as unknown as BodyInit, {
    headers: {
      'Content-Type': media.contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
