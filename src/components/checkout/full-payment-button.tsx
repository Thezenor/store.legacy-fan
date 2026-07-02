'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
type ClubType = string;

/**
 * Botón "pagar el restante": form POST clásico a /api/checkout/full/start, que
 * crea la orden y redirige (303) a PayPal. Navegación normal en vez de server
 * action: inmune a corrupción del canal RSC (Cloudflare) y a clientes de un
 * build anterior, que provocaban "Application error" al pulsar.
 */
export function FullPaymentButton({
  club,
  label,
  pendingLabel,
}: {
  club: ClubType;
  label: string;
  pendingLabel: string;
  errors?: Record<string, string>;
}) {
  const locale = useLocale();
  const [pending, setPending] = useState(false);

  return (
    <form action="/api/checkout/full/start" method="POST" onSubmit={() => setPending(true)}>
      <input type="hidden" name="club" value={club} />
      <input type="hidden" name="locale" value={locale} />
      <button
        type="submit"
        disabled={pending}
        className="bevel w-full bg-gold px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#1a1408] transition hover:bg-gold-light disabled:opacity-60"
      >
        {pending ? pendingLabel : label}
      </button>
    </form>
  );
}
