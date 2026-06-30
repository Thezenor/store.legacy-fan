'use client';

import { useTransition } from 'react';
import { useRouter } from '@/i18n/navigation';
import { setCurrencyAction } from '@/lib/commerce/currency';

type Currency = 'EUR' | 'USD';

export function CurrencySwitcher({ current }: { current: Currency }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function choose(c: Currency) {
    if (c === current) return;
    startTransition(async () => {
      await setCurrencyAction(c);
      router.refresh();
    });
  }

  return (
    <div
      role="group"
      aria-label="Currency"
      className="inline-flex overflow-hidden rounded-full border border-border text-sm"
    >
      {(['EUR', 'USD'] as Currency[]).map((c) => (
        <button
          key={c}
          type="button"
          disabled={pending}
          onClick={() => choose(c)}
          aria-pressed={c === current}
          className={`px-3 py-2 transition sm:py-1.5 ${
            c === current ? 'bg-gold text-[#1a1408]' : 'bg-surface text-muted hover:text-foreground'
          }`}
        >
          {c === 'EUR' ? '€ EUR' : '$ USD'}
        </button>
      ))}
    </div>
  );
}
