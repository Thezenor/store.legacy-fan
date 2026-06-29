'use client';

import { useActionState } from 'react';
import { createManualMemberAction, type ManualMemberResult } from '@/lib/admin-actions';

export function ManualMemberForm() {
  const [state, action, pending] = useActionState<ManualMemberResult | null, FormData>(
    createManualMemberAction,
    null,
  );

  return (
    <form action={action} className="mt-4 flex flex-wrap items-end gap-3 rounded-card border border-border bg-surface p-4">
      <label className="block">
        <span className="text-xs text-muted">Email del usuario</span>
        <input name="email" type="email" required className="mt-1 w-full rounded border border-border bg-background px-2 py-1.5 text-foreground sm:w-56" />
      </label>
      <label className="block">
        <span className="text-xs text-muted">Club</span>
        <select name="club" className="mt-1 rounded border border-border bg-background px-2 py-1.5 text-foreground">
          <option value="PRIME">PRIME</option>
          <option value="PRESTIGE">PRESTIGE</option>
        </select>
      </label>
      <label className="block">
        <span className="text-xs text-muted">Nº reservado (1–100)</span>
        <input name="number" type="number" min={1} max={100} required className="mt-1 w-28 rounded border border-border bg-background px-2 py-1.5 text-foreground" />
      </label>
      <button type="submit" disabled={pending} className="rounded bg-gold-grad px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#160f02] disabled:opacity-60">
        {pending ? '…' : 'Crear socio'}
      </button>
      {state ? (
        <span className={`text-sm ${state.ok ? 'text-state-green' : 'text-red-400'}`}>
          {state.ok ? `Socio creado: ${state.number}` : state.error}
        </span>
      ) : null}
    </form>
  );
}
