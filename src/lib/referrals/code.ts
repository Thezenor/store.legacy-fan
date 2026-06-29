import { randomBytes } from 'node:crypto';
import type { Prisma } from '@prisma/client';

// Código de referido por socio (doc 06). Alfanumérico legible (sin 0/O/1/I).
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCode(len = 8): string {
  const bytes = randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return `LF${out}`;
}

/**
 * Garantiza que el usuario tenga un código de referido único. Idempotente.
 * Se llama al activar la membresía (cada socio tiene su código).
 */
export async function ensureReferralCode(tx: Prisma.TransactionClient, userId: string) {
  const existing = await tx.referralCode.findUnique({ where: { userId } });
  if (existing) return existing;

  // Reintentos por si hubiera colisión (muy improbable).
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    const clash = await tx.referralCode.findUnique({ where: { code } });
    if (!clash) {
      return tx.referralCode.create({ data: { userId, code } });
    }
  }
  throw new Error('No se pudo generar un código de referido único.');
}
