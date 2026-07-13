// Parámetros del Programa de Embajadores (Bases VER 5 / Bloque 2).
// "Regla de oro": nada hardcodeado en la lógica; todo vive aquí con valores por
// defecto y se puede sobreescribir desde el super admin vía SystemSetting
// (grupo 'ambassador'). Los importes en CÉNTIMOS; el valor funciona igual en
// EUR o USD (nunca se mezclan ni se convierten).

import { getSettingString } from '../commerce/settings';

export type ModelKey = 'A' | 'B' | 'C';

/** Reparto del valor del alta [%\_embajador, %\_cliente] por modelo. */
export const MODEL_SPLIT: Record<ModelKey, [number, number]> = {
  A: [100, 0], // Comisión
  B: [0, 100], // Descuento
  C: [50, 50], // Mixto
};

export const AMBASSADOR_DEFAULTS = {
  // Valor fijo por alta (CPA) — 15 Prime / 30 Prestige.
  rewardPrimeCents: 1500,
  rewardPrestigeCents: 3000,
  // Crédito en tienda: +20% extra sobre lo generado en fase inicial.
  creditBonusPct: 20,
  // Retención mínima tras el PAGO TOTAL antes de validar (días).
  retentionDays: 20,
  // Umbral para solicitar cobro post-campaña (céntimos = 100).
  payoutThresholdCents: 10000,
  // A partir de este importe el embajador aporta su propia factura (>1.000).
  ownInvoiceAboveCents: 100000,
  // Reactivación del código para seguir devengando (meses; editable en admin).
  reactivateMonths: 6,
  // Atribución: cookie last-click y reserva del nº de socio en un checkout sin pagar.
  attributionCookieDays: 30,
  numberHoldHours: 48,
} as const;

/** Clave de SystemSetting para un parámetro del programa. */
export const settingKey = (k: keyof typeof AMBASSADOR_DEFAULTS) => `ambassador.${k}`;

/**
 * ¿Está ACTIVO el programa? Por defecto NO: mientras se construye, ningún
 * gancho del checkout hace nada. Se activa poniendo `ambassador.enabled=true`
 * en SystemSetting desde el super admin.
 */
export async function isAmbassadorProgramEnabled(): Promise<boolean> {
  const v = await getSettingString('ambassador.enabled');
  return v === 'true' || v === '1';
}

/** Parámetros resueltos (override de BD sobre los defaults). Todos numéricos. */
export async function getAmbassadorConfig(): Promise<typeof AMBASSADOR_DEFAULTS> {
  const keys = Object.keys(AMBASSADOR_DEFAULTS) as (keyof typeof AMBASSADOR_DEFAULTS)[];
  const entries = await Promise.all(
    keys.map(async (k) => {
      const raw = await getSettingString(settingKey(k));
      const n = raw == null ? NaN : Number(raw);
      return [k, Number.isFinite(n) ? n : AMBASSADOR_DEFAULTS[k]] as const;
    }),
  );
  return Object.fromEntries(entries) as typeof AMBASSADOR_DEFAULTS;
}

/** Valor fijo del alta según plan (céntimos), antes de repartir por modelo. */
export function rewardForPlan(plan: string, cfg = AMBASSADOR_DEFAULTS): number {
  return plan.toUpperCase() === 'PRESTIGE' ? cfg.rewardPrestigeCents : cfg.rewardPrimeCents;
}

/**
 * Reparte el valor del alta entre embajador (recompensa) y cliente (descuento)
 * según el modelo. Redondeo al céntimo; el modelo C parte por la mitad.
 */
export function splitReward(
  totalCents: number,
  model: ModelKey,
): { rewardCents: number; discountCents: number } {
  const [amb, cli] = MODEL_SPLIT[model];
  const rewardCents = Math.round((totalCents * amb) / 100);
  const discountCents = totalCents - rewardCents; // el resto va al cliente (evita perder céntimos)
  return { rewardCents, discountCents: (cli === 0 ? 0 : discountCents) };
}
