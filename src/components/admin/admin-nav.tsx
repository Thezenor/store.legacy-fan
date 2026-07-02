'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type AdminNavItem = { href: string; label: string };
export type AdminNavGroup = { title: string; items: AdminNavItem[] };

const STORE_KEY = 'lf-admin-nav-open';

export function AdminNav({ groups }: { groups: AdminNavGroup[] }) {
  const pathname = usePathname();

  // Solo UNA entrada activa: la de href más específico que coincida.
  const allHrefs = groups.flatMap((g) => g.items.map((i) => i.href));
  const activeHref = allHrefs
    .filter((href) =>
      href === '/lf-admin' ? pathname === '/lf-admin' : pathname === href || pathname.startsWith(`${href}/`),
    )
    .sort((a, b) => b.length - a.length)[0];
  const activeGroup = groups.find((g) => g.items.some((i) => i.href === activeHref))?.title;

  // Secciones abiertas (persistidas). Estado inicial estable para SSR; se
  // hidrata desde localStorage tras montar (evita desajuste de hidratación).
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stored: Record<string, boolean> = {};
    try {
      stored = JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}');
    } catch {
      /* ignora JSON inválido */
    }
    setOpen(stored);
    setReady(true);
  }, []);

  // Antes de hidratar: abre solo la sección activa (o Panel). Tras hidratar:
  // respeta lo guardado, pero la sección activa siempre se muestra abierta.
  const isOpen = (title: string) =>
    ready ? (open[title] ?? title === activeGroup) : title === activeGroup || title === 'Panel';

  function toggle(title: string) {
    setOpen((prev) => {
      const next = { ...prev, [title]: !(prev[title] ?? title === activeGroup) };
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(next));
      } catch {
        /* almacenamiento no disponible */
      }
      return next;
    });
  }

  return (
    <nav className="mt-6 max-h-[60vh] overflow-y-auto md:max-h-none md:overflow-visible">
      {groups.map((group) => {
        const groupOpen = isOpen(group.title);
        const hasActive = group.title === activeGroup;
        return (
          <div key={group.title} className="mb-1.5">
            <button
              type="button"
              onClick={() => toggle(group.title)}
              aria-expanded={groupOpen}
              className="flex w-full items-center justify-between rounded px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-faint transition hover:text-muted"
            >
              <span className={hasActive ? 'text-gold-light' : ''}>{group.title}</span>
              <span className={`text-[9px] transition-transform ${groupOpen ? 'rotate-90' : ''}`}>▸</span>
            </button>
            {groupOpen ? (
              <div className="mt-0.5 flex flex-wrap gap-1 md:flex-col">
                {group.items.map((n) => {
                  const active = n.href === activeHref;
                  return (
                    <Link
                      key={n.href}
                      href={n.href}
                      aria-current={active ? 'page' : undefined}
                      className={`rounded px-3 py-1.5 text-sm transition ${
                        active
                          ? 'border-l-2 border-gold bg-gold/10 font-semibold text-gold-light'
                          : 'border-l-2 border-transparent text-muted hover:bg-surface-elevated hover:text-foreground'
                      }`}
                    >
                      {n.label}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
