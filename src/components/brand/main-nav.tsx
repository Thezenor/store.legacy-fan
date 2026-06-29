'use client';

import { useState } from 'react';
import { Link, usePathname } from '@/i18n/navigation';

type Item = { href: string; label: string };

export function MainNav({
  items,
  menuLabel,
}: {
  items: Item[];
  menuLabel: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === '/club' ? pathname === '/club' : pathname.startsWith(href);

  return (
    <>
      {/* Desktop */}
      <nav className="hidden items-center gap-7 md:flex">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={`text-xs uppercase tracking-[0.14em] transition ${
              isActive(it.href) ? 'text-gold-light' : 'text-muted hover:text-foreground'
            }`}
          >
            {it.label}
          </Link>
        ))}
      </nav>

      {/* Mobile: botón hamburguesa */}
      <button
        type="button"
        aria-label={menuLabel}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground md:hidden"
      >
        <span className="text-lg leading-none">{open ? '✕' : '☰'}</span>
      </button>

      {/* Mobile: panel desplegable */}
      {open ? (
        <div className="absolute inset-x-0 top-[68px] z-40 border-b border-border bg-background/95 backdrop-blur-md md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col px-4 py-3">
            {items.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                onClick={() => setOpen(false)}
                className={`border-b border-border/60 py-3 text-sm uppercase tracking-[0.14em] last:border-0 ${
                  isActive(it.href) ? 'text-gold-light' : 'text-muted'
                }`}
              >
                {it.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </>
  );
}
