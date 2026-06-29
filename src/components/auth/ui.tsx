'use client';

import { useFormStatus } from 'react-dom';

export const inputClass =
  'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition focus:border-gold';

export function Field({
  label,
  name,
  type = 'text',
  required,
  defaultValue,
  autoComplete,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  autoComplete?: string;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-muted">{label}</span>
      <input
        className={inputClass}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        aria-invalid={!!error}
      />
      {error ? <span className="mt-1 block text-xs text-red-400">{error}</span> : null}
    </label>
  );
}

export function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded bg-gold-grad px-5 py-3 text-sm font-semibold uppercase tracking-wider text-[#160f02] transition hover:brightness-110 disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function Alert({ kind, children }: { kind: 'error' | 'success'; children: React.ReactNode }) {
  const cls =
    kind === 'error'
      ? 'border-red-500/40 bg-red-500/10 text-red-300'
      : 'border-green-500/40 bg-green-500/10 text-green-300';
  return <div className={`rounded-lg border px-3 py-2 text-sm ${cls}`}>{children}</div>;
}

export function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-md animate-fade-in">
      <h1 className="mb-6 font-display text-3xl font-bold text-metal-gold">{title}</h1>
      <div className="rounded-card border border-border bg-surface p-6 shadow-card">{children}</div>
    </section>
  );
}
