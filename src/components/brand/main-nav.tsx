'use client';

import { useState } from 'react';
import { Link, usePathname } from '@/i18n/navigation';

// Tipos de ítem del menú: interno (localizado), externo (sitio corporativo) y desplegable.
export type NavItem =
  | { kind: 'link'; href: string; label: string }
  | { kind: 'external'; href: string; label: string }
  | { kind: 'menu'; label: string; basePath: string; children: { href: string; label: string }[] };

const baseLink = 'whitespace-nowrap transition';
const linkStyle = { fontSize: '13px', letterSpacing: '0.04em' } as const;

export function MainNav({ items, menuLabel }: { items: NavItem[]; menuLabel: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  const cls = (active: boolean) =>
    `${baseLink} ${active ? 'font-semibold text-gold-light' : 'font-medium text-[#cbc8c0] hover:text-foreground'}`;

  return (
    <>
      {/* Desktop */}
      <nav className="hidden flex-1 items-center justify-center gap-6 md:flex">
        {items.map((it) => {
          if (it.kind === 'external') {
            return (
              <a key={it.label} href={it.href} target="_blank" rel="noopener noreferrer" style={linkStyle} className={cls(false)}>
                {it.label}
              </a>
            );
          }
          if (it.kind === 'link') {
            return (
              <Link key={it.href} href={it.href} style={linkStyle} className={cls(isActive(it.href))}>
                {it.label}
              </Link>
            );
          }
          // Desplegable (hover/focus)
          return (
            <div key={it.label} className="group relative">
              <button type="button" style={linkStyle} className={`${cls(isActive(it.basePath))} inline-flex items-center gap-1`}>
                {it.label} <span className="text-[9px]">▾</span>
              </button>
              <div className="invisible absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <div className="min-w-[160px] border border-border bg-surface py-2 shadow-card">
                  {it.children.map((c) => (
                    <Link key={c.href} href={c.href} className="block px-4 py-2 text-[13px] text-[#cbc8c0] hover:bg-surface-elevated hover:text-foreground">
                      {c.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Mobile: hamburguesa */}
      <button
        type="button"
        aria-label={menuLabel}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-foreground md:hidden"
      >
        <span className="text-lg leading-none">{open ? '✕' : '☰'}</span>
      </button>

      {/* Mobile: panel */}
      {open ? (
        <div className="absolute inset-x-0 top-full z-40 max-h-[80vh] overflow-y-auto border-b border-border bg-background/95 backdrop-blur-md md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col px-4 py-2">
            {items.map((it) => {
              if (it.kind === 'external') {
                return (
                  <a key={it.label} href={it.href} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className="border-b border-border/60 py-3 text-sm tracking-[0.04em] text-[#cbc8c0]">
                    {it.label}
                  </a>
                );
              }
              if (it.kind === 'link') {
                return (
                  <Link key={it.href} href={it.href} onClick={() => setOpen(false)} className={`border-b border-border/60 py-3 text-sm tracking-[0.04em] ${isActive(it.href) ? 'font-semibold text-gold-light' : 'text-[#cbc8c0]'}`}>
                    {it.label}
                  </Link>
                );
              }
              return (
                <div key={it.label} className="border-b border-border/60 py-3">
                  <span className="text-sm font-semibold tracking-[0.04em] text-foreground">{it.label}</span>
                  <div className="mt-2 flex flex-col gap-1 pl-3">
                    {it.children.map((c) => (
                      <Link key={c.href} href={c.href} onClick={() => setOpen(false)} className="py-1 text-sm text-[#cbc8c0]">
                        {c.label}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>
      ) : null}
    </>
  );
}
