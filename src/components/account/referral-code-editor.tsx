'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { updateReferralCodeAction, type ReferralCodeResult } from '@/lib/account-actions';

export interface ReferralLabels {
  hint: string;
  locked: string;
  checking: string;
  available: string;
  taken: string;
  invalid: string;
  tooShort: string;
  tooLong: string;
  save: string;
  saved: string;
  placeholder: string;
}

type Check =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'ok' }
  | { state: 'error'; reason: 'taken' | 'invalid' | 'too_short' | 'too_long' };

export function ReferralCodeEditor({
  currentCode,
  customized,
  labels,
}: {
  currentCode: string;
  customized: boolean;
  labels: ReferralLabels;
}) {
  const [value, setValue] = useState('');
  const [check, setCheck] = useState<Check>({ state: 'idle' });
  const [result, formAction, pending] = useActionState<ReferralCodeResult | null, FormData>(
    updateReferralCodeAction,
    null,
  );
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ya personalizado (o acaba de guardarse): bloqueado.
  const locked = customized || result?.ok === true;

  // Comprobación en tiempo real (debounced) contra /api/referral/check.
  useEffect(() => {
    if (locked) return;
    const code = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (timer.current) clearTimeout(timer.current);
    if (!code || code === currentCode) {
      setCheck({ state: 'idle' });
      return;
    }
    setCheck({ state: 'checking' });
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/referral/check?code=${encodeURIComponent(code)}`);
        const data = await res.json();
        if (data.ok && data.available) setCheck({ state: 'ok' });
        else setCheck({ state: 'error', reason: (data.reason ?? 'invalid') as 'taken' | 'invalid' | 'too_short' | 'too_long' });
      } catch {
        setCheck({ state: 'idle' });
      }
    }, 350);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value, currentCode, locked]);

  if (locked) {
    return <p className="mt-3 text-xs text-faint">{labels.locked}</p>;
  }

  const reasonLabel: Record<string, string> = {
    taken: labels.taken,
    invalid: labels.invalid,
    too_short: labels.tooShort,
    too_long: labels.tooLong,
  };
  const serverReason =
    result && !result.ok && result.reason !== 'same' ? reasonLabel[result.reason] : null;

  const inputCode = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const canSave = check.state === 'ok' && !pending;

  return (
    <form action={formAction} className="mt-4 border-t border-border/60 pt-4">
      <p className="text-xs text-muted">{labels.hint}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          name="code"
          value={value}
          onChange={(e) => setValue(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16))}
          placeholder={labels.placeholder}
          maxLength={16}
          autoComplete="off"
          spellCheck={false}
          className="w-44 rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm uppercase tracking-wider text-foreground outline-none focus:border-gold"
        />
        <button
          type="submit"
          disabled={!canSave}
          className="rounded-lg border border-gold/50 bg-gold/10 px-4 py-2 text-sm font-medium text-gold-light transition hover:bg-gold/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {labels.save}
        </button>
      </div>

      {/* Estado en tiempo real */}
      <p className="mt-2 min-h-[1.1rem] text-xs">
        {result?.ok ? (
          <span className="text-green-400">{labels.saved}</span>
        ) : serverReason ? (
          <span className="text-[#c0605a]">{serverReason}</span>
        ) : check.state === 'checking' ? (
          <span className="text-muted">{labels.checking}</span>
        ) : check.state === 'ok' ? (
          <span className="text-green-400">✓ {inputCode} · {labels.available}</span>
        ) : check.state === 'error' ? (
          <span className="text-[#c0605a]">✕ {reasonLabel[check.reason]}</span>
        ) : null}
      </p>
    </form>
  );
}
