import { randomBytes } from 'node:crypto';
import { prisma } from './prisma';

// Tokens de un solo uso para verificación de email y reset de contraseña.
// Reutiliza el modelo VerificationToken (identifier + token + expires).
// El identifier distingue el propósito: email plano para verificar, `reset:email` para reset.

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24 h
const RESET_TTL_MS = 60 * 60 * 1000; // 1 h

function newToken(): string {
  return randomBytes(32).toString('hex');
}

async function createToken(identifier: string, ttlMs: number): Promise<string> {
  // Invalida tokens previos del mismo propósito.
  await prisma.verificationToken.deleteMany({ where: { identifier } });
  const token = newToken();
  await prisma.verificationToken.create({
    data: { identifier, token, expires: new Date(Date.now() + ttlMs) },
  });
  return token;
}

/** Consume un token si es válido (existe y no caducado). Devuelve true si se consumió. */
async function consumeToken(identifier: string, token: string): Promise<boolean> {
  const row = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier, token } },
  });
  if (!row) return false;
  // Borrado atómico: si lo borramos, era válido para consumir.
  await prisma.verificationToken.delete({
    where: { identifier_token: { identifier, token } },
  });
  return row.expires.getTime() >= Date.now();
}

export const emailVerification = {
  create: (email: string) => createToken(email.toLowerCase(), VERIFY_TTL_MS),
  consume: (email: string, token: string) => consumeToken(email.toLowerCase(), token),
};

export const passwordReset = {
  create: (email: string) => createToken(`reset:${email.toLowerCase()}`, RESET_TTL_MS),
  consume: (email: string, token: string) => consumeToken(`reset:${email.toLowerCase()}`, token),
};
