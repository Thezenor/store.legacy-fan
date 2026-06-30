import 'server-only';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { prisma } from '../prisma';
import { getSettingString } from '../commerce/settings';

/**
 * Token de socio firmado para el carnet digital / entrada a eventos.
 *
 * Diseño "datos limitados pero cifrados": el QR del carnet NO contiene datos
 * personales en claro, solo un token compacto firmado con HMAC-SHA256 (clave
 * secreta solo en el servidor). El portador del QR no puede leer ni falsificar
 * nada; la verificación real (identidad, estado, revocación) ocurre en el
 * servidor vía /api/verify-member. Esta misma base alimentará después los
 * pases de Apple Wallet (.pkpass) y Google Wallet (JWT) sin rehacer nada.
 *
 * Formato del token: base64url(payloadJSON) + '.' + base64url(HMAC).
 * Es compatible en espíritu con un JWS compacto, pero sin dependencias.
 */

export type MemberTokenPayload = {
  v: 1;
  sub: string; // userId
  num: string; // número de socio formateado (LF-000051)
  tier: string; // club (PRIME | PRESTIGE)
  iat: number; // emitido (epoch s)
  exp: number; // caduca (epoch s)
};

const SECRET_KEY = 'wallet.token_secret';
const TTL_KEY = 'wallet.token_ttl_days';
const DEFAULT_TTL_DAYS = 365;

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromB64url(s: string): Buffer {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

/** Secreto HMAC: BD (panel) o variable de entorno como respaldo. null si no hay. */
export async function getPassSecret(): Promise<string | null> {
  const fromDb = await getSettingString(SECRET_KEY);
  if (fromDb && fromDb.length >= 16) return fromDb;
  const fromEnv = process.env.MEMBER_PASS_SECRET;
  if (fromEnv && fromEnv.length >= 16) return fromEnv;
  return null;
}

/** Genera un secreto aleatorio robusto (base64, 32 bytes). */
export function generatePassSecret(): string {
  return randomBytes(32).toString('base64');
}

function sign(data: string, secret: string): string {
  return b64url(createHmac('sha256', secret).update(data).digest());
}

/** Firma un token de socio. now/ttl se inyectan para facilitar pruebas. */
export function signMemberToken(
  payload: Omit<MemberTokenPayload, 'v' | 'iat' | 'exp'>,
  secret: string,
  nowSec: number,
  ttlDays: number,
): string {
  const full: MemberTokenPayload = {
    v: 1,
    sub: payload.sub,
    num: payload.num,
    tier: payload.tier,
    iat: nowSec,
    exp: nowSec + ttlDays * 86400,
  };
  const body = b64url(Buffer.from(JSON.stringify(full)));
  return `${body}.${sign(body, secret)}`;
}

export type VerifyResult =
  | { valid: true; payload: MemberTokenPayload }
  | { valid: false; reason: 'malformed' | 'bad_signature' | 'expired' };

/** Verifica firma + caducidad. NO consulta la BD (eso lo hace el endpoint). */
export function verifyMemberToken(token: string, secret: string, nowSec: number): VerifyResult {
  const parts = token.split('.');
  if (parts.length !== 2) return { valid: false, reason: 'malformed' };
  const [body, sig] = parts;
  const expected = sign(body, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { valid: false, reason: 'bad_signature' };
  }
  let payload: MemberTokenPayload;
  try {
    payload = JSON.parse(fromB64url(body).toString('utf8'));
  } catch {
    return { valid: false, reason: 'malformed' };
  }
  if (payload.v !== 1 || !payload.sub || !payload.num) return { valid: false, reason: 'malformed' };
  if (typeof payload.exp !== 'number' || payload.exp < nowSec) return { valid: false, reason: 'expired' };
  return { valid: true, payload };
}

/** ¿Está activo el sistema de carnet digital/QR? (apagado por defecto). */
export async function isWalletEnabled(): Promise<boolean> {
  const row = await prisma.systemSetting.findUnique({ where: { key: 'wallet.enabled' } });
  return Boolean(row?.value);
}

async function getTtlDays(): Promise<number> {
  const v = await getSettingString(TTL_KEY);
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_TTL_DAYS;
}

/**
 * Emite el token del carnet de un socio si el sistema está activo y hay secreto.
 * Devuelve null si está desactivado o sin configurar (no es un error).
 */
export async function issueMemberToken(input: {
  userId: string;
  number: string;
  tier: string;
}): Promise<string | null> {
  if (!(await isWalletEnabled())) return null;
  const secret = await getPassSecret();
  if (!secret) return null;
  const ttlDays = await getTtlDays();
  const nowSec = Math.floor(Date.now() / 1000);
  return signMemberToken({ sub: input.userId, num: input.number, tier: input.tier }, secret, nowSec, ttlDays);
}
