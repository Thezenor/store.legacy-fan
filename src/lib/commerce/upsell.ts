import type { Currency } from '@prisma/client';
import { getBool, getSettingString } from './settings';
import { formatMoney } from './money';

export interface UpsellCoin {
  name: string;
  image: string | null;
}

export interface SecondCoinUpsell {
  coinA: UpsellCoin;
  coinB: UpsellCoin;
  /** Precio con descuento de la 2ª moneda (lo que se suma al pago). */
  secondCents: number;
  secondFormatted: string;
  /** Precio original (tachado), si está configurado y es mayor. */
  listCents: number | null;
  listFormatted: string | null;
}

const toCents = (v: string | null): number => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : 0;
};

/**
 * Configuración del upsell de 2ª moneda (SOLO Prestige; doc de decisiones).
 * Devuelve null si no aplica, no está activado, o falta lo mínimo para ofrecerlo
 * (las dos imágenes/nombres y un precio con descuento).
 */
export async function getSecondCoinUpsell(
  club: string,
  currency: Currency,
  locale?: string,
): Promise<SecondCoinUpsell | null> {
  if (club !== 'PRESTIGE') return null;
  if (!(await getBool('upsell.second_coin.enabled_prestige'))) return null;

  const cur = currency === 'USD' ? 'usd' : 'eur';
  const [aName, aImg, bName, bImg, priceRaw, listRaw] = await Promise.all([
    getSettingString('upsell.coin.a.name'),
    getSettingString('upsell.coin.a.image'),
    getSettingString('upsell.coin.b.name'),
    getSettingString('upsell.coin.b.image'),
    getSettingString(`upsell.second_coin.price_${cur}`),
    getSettingString(`upsell.second_coin.list_${cur}`),
  ]);

  const secondCents = toCents(priceRaw);
  // Necesitamos las dos imágenes y un precio para poder ofrecerlo.
  if (!aImg || !bImg || secondCents <= 0) return null;

  const listCents = toCents(listRaw);
  const showList = listCents > secondCents ? listCents : null;

  return {
    coinA: { name: aName || 'Moneda A', image: aImg },
    coinB: { name: bName || 'Moneda B', image: bImg },
    secondCents,
    secondFormatted: formatMoney(secondCents, currency, locale),
    listCents: showList,
    listFormatted: showList != null ? formatMoney(showList, currency, locale) : null,
  };
}
