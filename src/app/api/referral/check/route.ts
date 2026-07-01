import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { normalizeReferralCode, validateReferralCodeFormat } from '@/lib/referrals/code';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Comprobación en tiempo real de disponibilidad de un código de referido
 * personalizado. Solo para socios autenticados; con rate-limit.
 *   GET /api/referral/check?code=MICODIGO
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ ok: false, reason: 'unauthenticated' }, { status: 401 });

  const rl = rateLimit(`refcheck:${userId}`, 40, 60_000);
  if (!rl.success) return NextResponse.json({ ok: false, reason: 'rate_limited' }, { status: 429 });

  const raw = new URL(req.url).searchParams.get('code') ?? '';
  const code = normalizeReferralCode(raw);

  const fmt = validateReferralCodeFormat(code);
  if (fmt) return NextResponse.json({ ok: false, available: false, reason: fmt, normalized: code });

  // Libre si nadie lo tiene, o si ya es el propio código del usuario.
  const owner = await prisma.referralCode.findUnique({ where: { code }, select: { userId: true } });
  const available = !owner || owner.userId === userId;
  return NextResponse.json({ ok: true, available, reason: available ? null : 'taken', normalized: code });
}
