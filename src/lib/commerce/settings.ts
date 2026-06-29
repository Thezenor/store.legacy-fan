import { cache } from 'react';
import { prisma } from '../prisma';

/**
 * Acceso tipado a SystemSetting (fuente única de configuración comercial).
 * Memoizado por request con React cache para no golpear la BD repetidamente.
 * NUNCA hardcodear precios/fechas/flags: leer siempre desde aquí (doc 18).
 */

export type SettingKey =
  | 'payments.paypal.enabled'
  | 'payments.stripe.enabled'
  | 'payments.mode'
  | 'reservation.amount.eur'
  | 'reservation.amount.usd'
  | 'reservation.grace_days_after_launch'
  | 'reservation.refundable_hours_before_launch'
  | 'launch.date'
  | 'points.ratio_per_currency_unit'
  | 'points.expiry_years'
  | 'referrals.default_reward_mode'
  | 'upsell.second_coin.enabled_prime'
  | 'upsell.second_coin.enabled_prestige'
  | 'fiscal.company_name'
  | 'fiscal.base_country'
  | 'fiscal.base_currency'
  | 'fiscal.invoice_series'
  | 'system.maintenance_mode';

// Valores por defecto si una clave no existe en BD (resiliencia).
const DEFAULTS: Record<string, unknown> = {
  'payments.paypal.enabled': true,
  'payments.stripe.enabled': false,
  'payments.mode': 'test',
  'reservation.amount.eur': 5000,
  'reservation.amount.usd': 5000,
  'reservation.grace_days_after_launch': 7,
  'reservation.refundable_hours_before_launch': 24,
  'launch.date': null,
  'points.ratio_per_currency_unit': 1,
  'points.expiry_years': 2,
  'referrals.default_reward_mode': 'SPLIT_50_50',
  'upsell.second_coin.enabled_prime': false,
  'upsell.second_coin.enabled_prestige': true,
  'system.maintenance_mode': false,
};

const loadAll = cache(async (): Promise<Map<string, unknown>> => {
  const rows = await prisma.systemSetting.findMany();
  const map = new Map<string, unknown>();
  for (const r of rows) map.set(r.key, r.value);
  return map;
});

export async function getSetting<T = unknown>(key: SettingKey): Promise<T> {
  const map = await loadAll();
  const value = map.has(key) ? map.get(key) : DEFAULTS[key];
  return value as T;
}

export async function getBool(key: SettingKey): Promise<boolean> {
  return Boolean(await getSetting(key));
}

export async function getNumber(key: SettingKey): Promise<number> {
  return Number(await getSetting(key));
}

export async function getDate(key: SettingKey): Promise<Date | null> {
  const v = await getSetting<string | null>(key);
  return v ? new Date(v) : null;
}
