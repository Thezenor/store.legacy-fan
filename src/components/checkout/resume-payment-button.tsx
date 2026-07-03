'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';

/**
 * Botón "continuar el pago": form POST clásico a /api/checkout/resume, que
 * reutiliza la reserva pendiente y redirige (303) a PayPal. Navegación normal
 * (inmune a la corrupción del canal RSC tras Cloudflare).
 */
export function ResumePaymentButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const locale = useLocale();
  const [pending, setPending] = useState(false);

  return (
    <form action="/api/checkout/resume" method="POST" onSubmit={() => setPending(true)}>
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
