'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';

export const inputClass =
  'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition focus:border-gold focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background';

// Iconos ojo / ojo tachado.
function EyeIcon({ off }: { off?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
      {off ? (
        <>
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19M6.61 6.61A18.45 18.45 0 0 0 2 12s3 8 10 8a9.12 9.12 0 0 0 5.39-1.61" />
          <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88M2 2l20 20" />
        </>
      ) : (
        <>
          <path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

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
  const isPassword = type === 'password';
  const [show, setShow] = useState(false);
  const effectiveType = isPassword && show ? 'text' : type;

  return (
    <label className="block">
      <span className="mb-1 block text-sm text-muted">{label}</span>
      <div className="relative">
        <input
          className={`${inputClass} ${isPassword ? 'pr-11' : ''}`}
          name={name}
          type={effectiveType}
          required={required}
          defaultValue={defaultValue}
          autoComplete={autoComplete}
          aria-invalid={!!error}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={show}
            tabIndex={-1}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted transition hover:text-gold-light"
          >
            <EyeIcon off={show} />
          </button>
        ) : null}
      </div>
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
      className="bevel w-full bg-gold px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#1a1408] transition hover:bg-gold-light disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function Alert({ kind, children }: { kind: 'error' | 'success'; children: React.ReactNode }) {
  const cls =
    kind === 'error'
      ? 'border-red-500/40 bg-red-500/10 alert-error'
      : 'border-green-500/40 bg-green-500/10 alert-success';
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
