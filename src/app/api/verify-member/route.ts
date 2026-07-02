import { NextResponse, type NextRequest } from 'next/server';
import { verifyMemberByToken } from '@/lib/members/verify';
import { RL, clientIpFromHeaders } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Verificación del carnet de socio (uso programático / control de acceso).
 *   GET /api/verify-member?token=...
 * Para una pantalla amable de puerta, usar la página /verify?token=...
 */
export async function GET(req: NextRequest) {
  if (!RL.verifyMember(clientIpFromHeaders(req.headers)).success) {
    return NextResponse.json({ valid: false, reason: 'rate_limited' }, { status: 429 });
  }
  const token = new URL(req.url).searchParams.get('token') ?? '';
  const r = await verifyMemberByToken(token);

  switch (r.status) {
    case 'disabled':
      return NextResponse.json({ valid: false, reason: 'disabled' }, { status: 503 });
    case 'not_configured':
      return NextResponse.json({ valid: false, reason: 'not_configured' }, { status: 503 });
    case 'missing_token':
      return NextResponse.json({ valid: false, reason: 'missing_token' }, { status: 400 });
    case 'invalid':
      return NextResponse.json({ valid: false, reason: r.reason }, { status: 200 });
    case 'revoked':
      return NextResponse.json({ valid: false, reason: 'revoked', number: r.number }, { status: 200 });
    case 'valid':
      return NextResponse.json({
        valid: true,
        number: r.number,
        tier: r.tier,
        name: r.name,
        expiresAt: r.expiresAt,
      });
  }
}
