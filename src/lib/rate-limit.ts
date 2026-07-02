/**
 * Rate limiting en memoria (ventana fija) para el MVP (decisión D-010).
 * Suficiente para una instancia; migrable a Redis/Upstash al escalar.
 * No persiste entre reinicios ni se comparte entre procesos.
 */
type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * @param key  identificador (p.ej. `login:${ip}` o `register:${email}`)
 * @param limit  máximo de intentos en la ventana
 * @param windowMs  duración de la ventana en ms
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || now >= bucket.resetAt) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { success: true, remaining: limit - 1, resetAt };
  }

  if (bucket.count >= limit) {
    return { success: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return { success: true, remaining: limit - bucket.count, resetAt: bucket.resetAt };
}

// Limpieza periódica para evitar crecimiento ilimitado del Map.
const CLEANUP_INTERVAL = 10 * 60 * 1000;
if (typeof setInterval !== 'undefined') {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of store) {
      if (now >= bucket.resetAt) store.delete(key);
    }
  }, CLEANUP_INTERVAL);
  // No bloquear el cierre del proceso por este timer.
  if (typeof timer.unref === 'function') timer.unref();
}

/**
 * IP real del cliente a partir de las cabeceras. Detrás de Cloudflare la única
 * fiable es `cf-connecting-ip`; `x-forwarded-for` (extremo izquierdo) la pone
 * el cliente y es falsificable (permitiría saltarse los límites de login).
 */
export function clientIpFromHeaders(h: { get(name: string): string | null }): string {
  const cf = h.get('cf-connecting-ip');
  if (cf) return cf.trim();
  const fwd = h.get('x-forwarded-for');
  if (fwd) {
    // El último salto lo añade nuestro proxy (confiable); los primeros, el cliente.
    const parts = fwd.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }
  return h.get('x-real-ip') || 'unknown';
}

/** Presets comunes. */
export const RL = {
  login: (id: string) => rateLimit(`login:${id}`, 5, 15 * 60 * 1000), // 5 / 15 min
  register: (id: string) => rateLimit(`register:${id}`, 3, 60 * 60 * 1000), // 3 / h
  forgot: (id: string) => rateLimit(`forgot:${id}`, 3, 60 * 60 * 1000), // 3 / h
  verifyResend: (id: string) => rateLimit(`verify:${id}`, 3, 60 * 60 * 1000),
  emailCheck: (id: string) => rateLimit(`emailcheck:${id}`, 30, 10 * 60 * 1000), // 30 / 10 min
  verifyMember: (id: string) => rateLimit(`verifymember:${id}`, 60, 60 * 1000), // 60 / min (puerta de eventos)
  tokenConsume: (id: string) => rateLimit(`token:${id}`, 10, 15 * 60 * 1000), // verificar email / reset pass
};
