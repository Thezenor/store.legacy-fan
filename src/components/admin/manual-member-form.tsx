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
        <span className="text-xs text-muted">Fecha de alta</span>
        <input name="startsAt" type="date" className="mt-1 w-40 rounded border border-border bg-background px-2 py-1.5 text-foreground" />
        <span className="mt-0.5 block text-[10px] text-faint">Vacío = hoy</span>
      </label>
      <label className="block flex-1">
        <span className="text-xs text-muted">Observaciones</span>
        <input name="observations" placeholder="Motivo del alta…" className="mt-1 w-full rounded border border-border bg-background px-2 py-1.5 text-foreground" />
      </label>
      <button type="submit" disabled={pending} className="rounded bg-gold-grad px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#160f02] disabled:opacity-60">
        {pending ? '…' : 'Crear socio'}
      </button>
      <p className="w-full text-[11px] text-faint">
        El número de socio se asigna automáticamente: siguiente correlativo libre desde LF-000051.
      </p>
      {state ? (
        <span className={`text-sm ${state.ok ? 'text-state-green' : 'text-red-400'}`}>
          {state.ok ? `Socio creado: ${state.number}` : state.error}
        </span>
      ) : null}
    </form>
  );
}
