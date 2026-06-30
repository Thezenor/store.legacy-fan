'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { submitCancellationAction } from '@/lib/account-actions';

const REASONS = ['price', 'dont_use', 'content', 'found_alt', 'temporary', 'other'] as const;

// Flujo de retención al cancelar: intenta retener (seguir / bajar a Prime),
// recoge una pequeña encuesta e informa de la conservación legal de datos.
export function CancelSubscriptionFlow({ canDowngrade }: { canDowngrade: boolean }) {
  const a = useTranslations('account');
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded border border-red-500/40 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10"
      >
        {a('subCancel')}
      </button>
    );
  }

  return (
    <form action={submitCancellationAction} className="mt-2 space-y-3 rounded-card border border-gold/30 bg-surface-elevated p-4">
      <input type="hidden" name="locale" value={locale} />
      <h4 className="font-display text-base text-foreground">{a('retentionTitle')}</h4>

      {canDowngrade ? (
        <div className="rounded border border-gold/40 bg-gold/10 p-3">
          <p className="text-sm text-foreground">{a('retentionDowngradePitch')}</p>
        </div>
      ) : (
        <p className="text-sm text-muted">{a('retentionGenericPitch')}</p>
      )}

      <label className="block">
        <span className="mb-1 block text-xs text-muted">{a('retentionReasonLabel')}</span>
        <select
          name="reason"
          defaultValue=""
          className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground"
        >
          <option value="" disabled>
            {a('retentionReasonPlaceholder')}
          </option>
          {REASONS.map((r) => (
            <option key={r} value={r}>
              {a(`reason_${r}`)}
            </option>
          ))}
        </select>
      </label>

      <textarea
        name="comment"
        rows={2}
        placeholder={a('retentionCommentPlaceholder')}
        className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground"
      />

      <p className="text-[11px] text-faint">{a('dataRetentionNotice')}</p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="bevel bg-gold px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#1a1408]"
        >
          {a('retentionKeep')}
        </button>
        {canDowngrade ? (
          <button
            type="submit"
            name="outcome"
            value="downgrade"
            className="rounded border border-gold/50 px-4 py-2 text-xs font-medium uppercase tracking-wider text-gold-light hover:bg-surface"
          >
            {a('retentionDowngradeCta')}
          </button>
        ) : null}
        <button
          type="submit"
          name="outcome"
          value="cancel"
          className="rounded border border-red-500/40 px-4 py-2 text-xs text-red-400 hover:bg-red-500/10"
        >
          {a('retentionCancelAnyway')}
        </button>
      </div>
    </form>
  );
}
