// Motor comercial Legacy Fan: fuente única de fases, precios, reserva y settings.
// Regla doc 18: nunca hardcodear precios/fechas/flags; leer siempre desde aquí.
export * from './money';
export * from './settings';
export * from './phases';

import type { Currency } from './money';

/**
 * Resuelve la divisa de visualización (decisión D: selector manual, sin GEO).
 * Usa la preferencia del perfil si existe; por defecto EUR.
 */
export function resolveCurrency(preferred?: string | null): Currency {
  return preferred === 'USD' ? 'USD' : 'EUR';
}
