'use client';

import { useEffect, useState } from 'react';

export interface AccountNavItem {
  id: string;
  label: string;
}

// Menú lateral del panel de usuario: enlaces a las secciones con resaltado de la
// sección visible (scrollspy ligero).
export function AccountNav({ items }: { items: AccountNavItem[] }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: '-20% 0px -70% 0px' },
    );
    for (const it of items) {
      const el = document.getElementById(it.id);
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
  }, [items]);

  return (
    <nav className="flex gap-2 overflow-x-auto pb-2 md:sticky md:top-24 md:flex-col md:gap-1 md:overflow-visible md:pb-0">
      {items.map((it) => (
        <a
          key={it.id}
          href={`#${it.id}`}
          className={`whitespace-nowrap rounded px-3 py-2 text-sm transition ${
            active === it.id
              ? 'bg-gold/10 font-medium text-gold-light'
              : 'text-muted hover:bg-surface-elevated hover:text-foreground'
          }`}
        >
          {it.label}
        </a>
      ))}
    </nav>
  );
}
