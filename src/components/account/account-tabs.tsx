'use client';

import { useState, type ReactNode } from 'react';

export interface AccountTab {
  id: string;
  label: string;
  node: ReactNode;
}

// Panel de usuario por secciones: muestra UNA sección a la vez.
//  - Móvil/tablet: barra de chips siempre visible (scroll horizontal).
//  - Escritorio: menú lateral fijo.
export function AccountTabs({ items }: { items: AccountTab[] }) {
  const [active, setActive] = useState(items[0]?.id);
  const current = items.find((i) => i.id === active) ?? items[0];

  if (items.length === 0) return null;

  return (
    <div className="mt-8 grid gap-6 md:grid-cols-[210px_1fr]">
      {/* Móvil/tablet: chips horizontales (siempre visibles, scroll interno) */}
      <div className="min-w-0 max-w-full overflow-x-auto pb-2 [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max gap-2">
          {items.map((it) => (
            <button
              key={it.id}
              type="button"
              onClick={() => setActive(it.id)}
              aria-current={active === it.id ? 'true' : undefined}
              className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm transition ${
                active === it.id
                  ? 'border-gold/50 bg-gold/15 font-medium text-gold-light'
                  : 'border-border bg-surface text-muted'
              }`}
            >
              {it.label}
            </button>
          ))}
        </div>
      </div>

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
