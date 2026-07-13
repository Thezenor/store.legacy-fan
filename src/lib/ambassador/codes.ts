// Motor de códigos del Programa de Embajadores (Bloque 2 §2).
//  - Embajador: LEGACY + NOMBRE/MARCA, mayúsculas A-Z y dígitos, sin acentos/
//    eñes/espacios/símbolos, 12–26 caracteres, único.
//  - Referido de socio: LF + número de socio (LF0042).
// El modelo (A/B/C) y la divisa NO van en el código.

import { prisma } from '../prisma';

export type CodeType = 'AMBASSADOR' | 'MEMBER' | 'UNKNOWN';

export const AMBASSADOR_PREFIX = 'LEGACY';
export const MEMBER_PREFIX = 'LF';
export const CODE_MIN = 12;
export const CODE_MAX = 26;

/** Normaliza: quita acentos/eñes/símbolos/espacios, a MAYÚSCULAS, solo A-Z0-9. */
export function normalizeCode(raw: string): string {
  return (raw ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // diacríticos (Muñoz -> Munoz)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

/** Genera el código de embajador a partir del nombre/marca (LEGACY + …). */
export function ambassadorCodeFromName(name: string): string {
  const norm = normalizeCode(name);
  return norm.startsWith(AMBASSADOR_PREFIX) ? norm : AMBASSADOR_PREFIX + norm;
}

/** Clasifica un código por su prefijo (sin tocar la BD). */
export function classifyCode(raw: string): CodeType {
  const c = normalizeCode(raw);
  if (/^LF\d{3,}$/.test(c)) return 'MEMBER';
  if (c.startsWith(AMBASSADOR_PREFIX) && c.length >= 8) return 'AMBASSADOR';
  return 'UNKNOWN';
}

/** ¿Formato válido de código de embajador (longitud 12–26 y prefijo)? */
export function isValidAmbassadorCode(raw: string): boolean {
  const c = normalizeCode(raw);
  return c.startsWith(AMBASSADOR_PREFIX) && c.length >= CODE_MIN && c.length <= CODE_MAX;
}

export type CodeLookup =
  | { type: 'AMBASSADOR'; code: string; ambassadorId: string; active: boolean }
  | { type: 'MEMBER'; code: string; referrerUserId: string; active: boolean }
  | null;

/**
 * Resuelve un código contra la BD. Devuelve a quién pertenece y si está ACTIVO
 * (para embajador: estado ACTIVO; para socio: el código existe). `active=false`
 * significa que no debe aceptarse en checkout (suspendido/cancelado).
 */
export async function lookupCode(raw: string): Promise<CodeLookup> {
  const code = normalizeCode(raw);
  if (!code) return null;
  const kind = classifyCode(code);

  if (kind === 'AMBASSADOR') {
    const amb = await prisma.ambassador.findUnique({
      where: { code },
      select: { id: true, status: true },
    });
    if (!amb) return null;
    return { type: 'AMBASSADOR', code, ambassadorId: amb.id, active: amb.status === 'ACTIVO' };
  }

  if (kind === 'MEMBER') {
    // Código de referido de socio (LF…). La numeración/alineación fina con el
    // sistema de referidos existente se cierra en la fase de integración.
    const rc = await prisma.referralCode.findUnique({
      where: { code },
      select: { userId: true },
    });
    if (!rc) return null;
    return { type: 'MEMBER', code, referrerUserId: rc.userId, active: true };
  }

  return null;
}

/**
 * Código efectivo del alta según prioridad (Bloque 2 §3.1):
 * escrito a mano por el cliente > código del enlace/cookie.
 */
export function resolveEffectiveCode(opts: {
  typed?: string | null;
  linkOrCookie?: string | null;
}): string | null {
  const typed = normalizeCode(opts.typed ?? '');
  if (typed) return typed;
  const link = normalizeCode(opts.linkOrCookie ?? '');
  return link || null;
}
