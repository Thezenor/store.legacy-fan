'use client';

import { useState, type ReactNode } from 'react';

export interface AccountTab {
  id: string;
  label: string;
  node: ReactNode;
}

// Panel de usuario por pestañas: muestra UNA sección a la vez. En móvil, un
// selector desplegable; en escritorio, menú lateral fijo.
export function AccountTabs({ items }: { items: AccountTab[] }) {
  const [active, setActive] = useState(items[0]?.id);
  const current = items.find((i) => i.id === active) ?? items[0];

  return (
    <div className="mt-8 grid gap-6 md:grid-cols-[210px_1fr]">
      {/* Móvil: selector */}
      <label className="block md:hidden">
        <span className="sr-only">Sección</span>
        <select
          value={active}
          onChange={(e) => setActive(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-foreground"
        >
          {items.map((it) => (
            <option key={it.id} value={it.id}>
              {it.label}
            </option>
          ))}
        </select>
      </label>

      {/* Escritorio: menú lateral */}
      <nav className="hidden md:sticky md:top-24 md:flex md:flex-col md:gap-1 md:self-start">
        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            onClick={() => setActive(it.id)}
            aria-current={active === it.id ? 'true' : undefined}
            className={`rounded px-3 py-2 text-left text-sm transition ${
              active === it.id
                ? 'bg-gold/10 font-medium text-gold-light'
                : 'text-muted hover:bg-surface-elevated hover:text-foreground'
            }`}
          >
            {it.label}
          </button>
        ))}
      </nav>

      <div className="min-w-0">{current?.node}</div>
    </div>
  );
}
