import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPassSecret, verifyMemberToken, isWalletEnabled } from '@/lib/members/pass-token';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Verificación del carnet de socio (entrada a eventos / control de acceso).
 *   GET /api/verify-member?token=...
 *
 * Valida la firma y la caducidad del token y comprueba contra la BD que el
 * socio sigue activo (revocación instantánea: basta con dar de baja la
 * membresía). Devuelve solo los datos necesarios para el control en puerta.
 * El token en sí no contiene datos personales en claro.
 */
export async function GET(req: NextRequest) {
  if (!(await isWalletEnabled())) {
    return NextResponse.json({ valid: false, reason: 'disabled' }, { status: 503 });
  }
  const token = new URL(req.url).searchParams.get('token') ?? '';
  if (!token) {
    return NextResponse.json({ valid: false, reason: 'missing_token' }, { status: 400 });
  }
  const secret = await getPassSecret();
  if (!secret) {
    return NextResponse.json({ valid: false, reason: 'not_configured' }, { status: 503 });
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const res = verifyMemberToken(token, secret, nowSec);
  if (!res.valid) {
    return NextResponse.json({ valid: false, reason: res.reason }, { status: 200 });
  }

  // Comprobación de estado en BD (revocación / baja / número cambiado).
  const membership = await prisma.membership.findUnique({
    where: { userId: res.payload.sub },
    include: { memberNumber: true, user: { select: { profile: { select: { firstName: true, lastName: true } } } } },
  });
  const active =
    membership?.status === 'SOCIO_ACTIVO' &&
    membership.memberNumber?.formatted === res.payload.num;

  if (!active) {
    return NextResponse.json({ valid: false, reason: 'revoked', number: res.payload.num }, { status: 200 });
  }

  const p = membership!.user?.profile;
  const name = p ? `${p.firstName} ${p.lastName}`.trim() : null;
  return NextResponse.json({
    valid: true,
    number: res.payload.num,
    tier: membership!.club,
    name, // para que el personal de puerta coteje identidad
    expiresAt: new Date(res.payload.exp * 1000).toISOString(),
  });
}
