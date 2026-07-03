'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

export interface UpsellData {
  coinA: { name: string; image: string | null };
  coinB: { name: string; image: string | null };
  /** Hay precio de la 2ª moneda → se puede ofrecer "pagarla ahora". */
  offerSecond: boolean;
  /** Importe de reserva (50 €/$) para la opción "reservarla". */
  reserveFormatted: string;
  secondFormatted: string;
  listFormatted: string | null;
}

type SecondChoice = 'reserve' | 'full' | 'none';

// Upsell de 2ª moneda (Prestige): el socio elige la moneda incluida y, al elegir,
// se despliega la oferta de añadir la otra con descuento. Emite campos ocultos
// includedCoin (a|b) y addSecondCoin (checkbox) dentro del formulario de checkout.
export function SecondCoinUpsell({ data }: { data: UpsellData }) {
  const tc = useTranslations('checkout');
  const [included, setIncluded] = useState<'a' | 'b' | null>(null);
  // Por defecto, dejamos señalada la opción de reservar (50 €/$).
  const [secondChoice, setSecondChoice] = useState<SecondChoice>('reserve');

  const coins: { key: 'a' | 'b'; name: string; image: string | null }[] = [
    { key: 'a', name: data.coinA.name, image: data.coinA.image },
    { key: 'b', name: data.coinB.name, image: data.coinB.image },
  ];
  const other = included ? coins.find((c) => c.key !== included)! : null;

  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <h3 className="font-display text-lg text-foreground">{tc('coinTitle')}</h3>
      <p className="mt-1 text-sm text-muted">{tc('coinHint')}</p>

      <input type="hidden" name="includedCoin" value={included ?? ''} />

      <div className="mt-4 grid grid-cols-2 gap-3">
        {coins.map((c) => {
          const active = included === c.key;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => {
                setIncluded(c.key);
                setSecondChoice('reserve'); // por defecto, reservar la segunda
              }}
              aria-pressed={active}
              className={`flex flex-col items-center rounded-card border p-3 text-center transition ${
                active ? 'border-gold bg-gold/10 ring-1 ring-gold/40' : 'border-border hover:border-gold/40'
              }`}
            >
              {c.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.image} alt={c.name} className="mx-auto aspect-square w-full max-w-[8rem] rounded object-cover" />
              ) : (
                <span className="mx-auto flex aspect-square w-full max-w-[8rem] items-center justify-center rounded bg-surface-elevated text-faint">
                  ?
                </span>
              )}
              <span className="mt-2 text-sm text-foreground">{c.name}</span>
              <span
                className={`mt-1 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                  active ? 'bg-gold text-[#1a1408]' : 'border border-border text-faint'
                }`}
              >
                {active ? tc('coinIncluded') : tc('choose')}
              </span>
            </button>
          );
        })}
      </div>

      {/* Desplegable: 3 opciones para la segunda moneda (reservar / pagar / no) */}
      {other ? (
        <div className="mt-4 animate-fade-in rounded-card border border-gold/30 bg-surface-elevated p-4">
          <input type="hidden" name="secondCoinChoice" value={secondChoice} />
          <div className="flex items-center gap-3">
            {other.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={other.image} alt={other.name} className="h-16 w-16 shrink-0 rounded object-cover" />
            ) : null}
            <div>
              <h4 className="text-sm font-semibold text-foreground">{tc('secondTitle')}</h4>
              <span className="text-sm text-muted">{other.name}</span>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {/* Opción 1: reservarla (50 €/$) — por defecto */}
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded border border-border px-3 py-2">
              <span className="flex items-center gap-2 text-sm text-foreground">
                <input type="radio" checked={secondChoice === 'reserve'} onChange={() => setSecondChoice('reserve')} />
                {tc('secondOptReserve')}
              </span>
              <span className="font-display font-bold tabular-nums text-metal-gold">{data.reserveFormatted}</span>
            </label>

            {/* Opción 2: pagarla ahora con descuento (si hay precio) */}
            {data.offerSecond ? (
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded border border-border px-3 py-2">
                <span className="flex items-center gap-2 text-sm text-foreground">
                  <input type="radio" checked={secondChoice === 'full'} onChange={() => setSecondChoice('full')} />
                  {tc('secondOptFull')}
                </span>
                <span className="flex items-baseline gap-2">
                  {data.listFormatted ? (
                    <span className="text-xs text-faint line-through">{data.listFormatted}</span>
                  ) : null}
                  <span className="font-display font-bold tabular-nums text-metal-gold">{data.secondFormatted}*</span>
                </span>
              </label>
            ) : null}

            {/* Opción 3: no, gracias */}
            <label className="flex cursor-pointer items-center gap-2 rounded border border-border px-3 py-2 text-sm text-muted">
              <input type="radio" checked={secondChoice === 'none'} onChange={() => setSecondChoice('none')} />
              {tc('secondOptNone')}
            </label>
          </div>

          {data.offerSecond ? <p className="mt-2 text-[11px] text-faint">{tc('secondDiscountNote')}</p> : null}
          <p className="mt-1 text-[11px] text-faint">{tc('photosReferenceNote')}</p>
        </div>
      ) : null}
    </div>
  );
}
