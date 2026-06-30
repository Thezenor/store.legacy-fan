import 'server-only';
import { prisma } from '../prisma';
import { getPassSecret, verifyMemberToken, isWalletEnabled } from './pass-token';

/**
 * Verificación de un token de carnet contra firma, caducidad y estado en BD.
 * Compartida por el endpoint /api/verify-member (JSON) y la página /verify
 * (control en puerta). Devuelve solo los datos necesarios.
 */
export type MemberVerification =
  | { status: 'disabled' }
  | { status: 'not_configured' }
  | { status: 'missing_token' }
  | { status: 'invalid'; reason: 'malformed' | 'bad_signature' | 'expired' }
  | { status: 'revoked'; number: string }
  | { status: 'valid'; number: string; tier: string; name: string | null; expiresAt: string };

export async function verifyMemberByToken(token: string): Promise<MemberVerification> {
  if (!(await isWalletEnabled())) return { status: 'disabled' };
  if (!token) return { status: 'missing_token' };
  const secret = await getPassSecret();
  if (!secret) return { status: 'not_configured' };

  const nowSec = Math.floor(Date.now() / 1000);
  const res = verifyMemberToken(token, secret, nowSec);
  if (!res.valid) return { status: 'invalid', reason: res.reason };

  const membership = await prisma.membership.findUnique({
    where: { userId: res.payload.sub },
    include: {
      memberNumber: true,
      user: { select: { profile: { select: { firstName: true, lastName: true } } } },
    },
  });
  const active =
    membership?.status === 'SOCIO_ACTIVO' &&
    membership.memberNumber?.formatted === res.payload.num;
  if (!active) return { status: 'revoked', number: res.payload.num };

  const p = membership!.user?.profile;
  const name = p ? `${p.firstName} ${p.lastName}`.trim() : null;
  return {
    status: 'valid',
    number: res.payload.num,
    tier: membership!.club,
    name,
    expiresAt: new Date(res.payload.exp * 1000).toISOString(),
  };
}
