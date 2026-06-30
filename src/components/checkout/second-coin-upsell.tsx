'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

export interface UpsellData {
  coinA: { name: string; image: string | null };
  coinB: { name: string; image: string | null };
  secondFormatted: string;
  listFormatted: string | null;
}

// Upsell de 2ª moneda (Prestige): el socio elige la moneda incluida y, al elegir,
// se despliega la oferta de añadir la otra con descuento. Emite campos ocultos
// includedCoin (a|b) y addSecondCoin (checkbox) dentro del formulario de checkout.
export function SecondCoinUpsell({ data }: { data: UpsellData }) {
  const tc = useTranslations('checkout');
  const [included, setIncluded] = useState<'a' | 'b' | null>(null);
  const [addSecond, setAddSecond] = useState(false);

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
                setAddSecond(false); // re-evaluar la segunda al cambiar la incluida
              }}
              aria-pressed={active}
              className={`flex flex-col items-center rounded-card border p-3 text-center transition ${
                active ? 'border-gold bg-gold/10 ring-1 ring-gold/40' : 'border-border hover:border-gold/40'
              }`}
            >
              {c.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.image} alt={c.name} className="h-28 w-28 rounded object-cover" />
              ) : (
                <span className="flex h-28 w-28 items-center justify-center rounded bg-surface-elevated text-faint">
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

      {/* Desplegable: ofrecer la segunda moneda con descuento */}
      {other ? (
        <div className="mt-4 animate-fade-in rounded-card border border-gold/30 bg-surface-elevated p-4">
          <h4 className="text-sm font-semibold text-foreground">{tc('secondTitle')}</h4>
          <label className="mt-3 flex items-center gap-3">
            {other.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={other.image} alt={other.name} className="h-16 w-16 rounded object-cover" />
            ) : null}
            <span className="flex-1">
              <span className="block text-sm text-foreground">{other.name}</span>
              <span className="mt-0.5 flex items-baseline gap-2">
                {data.listFormatted ? (
                  <span className="text-xs text-faint line-through">{data.listFormatted}</span>
                ) : null}
                <span className="font-display text-lg font-bold tabular-nums text-metal-gold">
                  {data.secondFormatted}
                </span>
              </span>
            </span>
            <input
              type="checkbox"
              name="addSecondCoin"
              checked={addSecond}
              onChange={(e) => setAddSecond(e.target.checked)}
              className="h-5 w-5"
            />
          </label>
          <p className="mt-2 text-xs text-muted">{tc('secondAdd')}</p>
        </div>
      ) : null}
    </div>
  );
}
