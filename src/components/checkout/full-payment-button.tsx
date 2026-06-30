'use client';

import { useState, useTransition } from 'react';
import { useLocale } from 'next-intl';
import type { ClubType } from '@prisma/client';
import { startFullPaymentAction } from '@/lib/checkout/actions';
import { Alert } from '@/components/auth/ui';

export function FullPaymentButton({
  club,
  label,
  pendingLabel,
  errors,
}: {
  club: ClubType;
  label: string;
  pendingLabel: string;
  errors: Record<string, string>;
}) {
  const locale = useLocale();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function go() {
    setError(null);
    startTransition(async () => {
      const res = await startFullPaymentAction(club, locale);
      if (res.ok) {
        window.location.href = res.approveUrl;
      } else {
        setError(errors[res.code] ?? errors.error);
      }
    });
  }

  return (
    <div className="space-y-3">
      {error ? <Alert kind="error">{error}</Alert> : null}
      <button
        type="button"
        onClick={go}
        disabled={pending}
        className="bevel w-full bg-gold px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#1a1408] transition hover:bg-gold-light disabled:opacity-60"
      >
        {pending ? pendingLabel : label}
      </button>
    </div>
  );
}
