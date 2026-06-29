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
      {/* Desktop (estilo del diseño: title-case 13px, tracking 0.04em) */}
      <nav className="hidden flex-1 items-center justify-center gap-6 md:flex">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            style={{ fontSize: '13px', letterSpacing: '0.04em' }}
            className={`whitespace-nowrap transition ${
              isActive(it.href)
                ? 'font-semibold text-gold-light'
                : 'font-medium text-[#cbc8c0] hover:text-foreground'
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
        className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-foreground md:hidden"
      >
        <span className="text-lg leading-none">{open ? '✕' : '☰'}</span>
      </button>

      {/* Mobile: panel desplegable */}
      {open ? (
        <div className="absolute inset-x-0 top-full z-40 border-b border-border bg-background/95 backdrop-blur-md md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col px-4 py-3">
            {items.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                onClick={() => setOpen(false)}
                className={`border-b border-border/60 py-3 text-sm tracking-[0.04em] last:border-0 ${
                  isActive(it.href) ? 'font-semibold text-gold-light' : 'text-[#cbc8c0]'
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
