import type { Currency } from '@prisma/client';
import { prisma } from '../prisma';
import { getBool, getSettingString } from './settings';
import { settingImg } from '../img';
import { formatMoney } from './money';

/** src para el cliente de la imagen de una moneda del upsell: si es data URI se
 *  sirve por /api/img (cacheable); si es URL externa se usa tal cual. */
async function coinImageSrc(key: string): Promise<string | null> {
  const row = await prisma.systemSetting.findUnique({ where: { key }, select: { value: true, updatedAt: true } });
  const v = row?.value == null ? null : String(row.value);
  if (!v) return null;
  return v.startsWith('data:') ? settingImg(key, row!.updatedAt) : v;
}

export interface UpsellCoin {
  name: string;
  image: string | null;
}

export interface SecondCoinUpsell {
  coinA: UpsellCoin;
  coinB: UpsellCoin;
  /** Hay precio configurado → se puede ofrecer añadir la 2ª moneda. */
  offerSecond: boolean;
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
    coinImageSrc('upsell.coin.a.image'),
    getSettingString('upsell.coin.b.name'),
    coinImageSrc('upsell.coin.b.image'),
    getSettingString(`upsell.second_coin.price_${cur}`),
    getSettingString(`upsell.second_coin.list_${cur}`),
  ]);

  // Con el flag activado ya mostramos la ELECCIÓN de moneda (nombres/imágenes
  // opcionales: placeholder si faltan). La OFERTA de la 2ª moneda solo se muestra
  // si hay precio con descuento configurado.
  const secondCents = toCents(priceRaw);
  const listCents = toCents(listRaw);
  const showList = listCents > secondCents ? listCents : null;

  return {
    coinA: { name: aName || 'Moneda A', image: aImg },
    coinB: { name: bName || 'Moneda B', image: bImg },
    offerSecond: secondCents > 0,
    secondCents,
    secondFormatted: formatMoney(secondCents, currency, locale),
    listCents: showList,
    listFormatted: showList != null ? formatMoney(showList, currency, locale) : null,
  };
}
