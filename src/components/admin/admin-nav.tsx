'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type AdminNavItem = { href: string; label: string };
export type AdminNavGroup = { title: string; items: AdminNavItem[] };

export function AdminNav({ groups }: { groups: AdminNavGroup[] }) {
  const pathname = usePathname();

  // Solo UNA entrada activa: la de href más específico que coincida.
  const allHrefs = groups.flatMap((g) => g.items.map((i) => i.href));
  const activeHref = allHrefs
    .filter((href) =>
      href === '/lf-admin' ? pathname === '/lf-admin' : pathname === href || pathname.startsWith(`${href}/`),
    )
    .sort((a, b) => b.length - a.length)[0];

  return (
    <nav className="mt-6 max-h-52 overflow-y-auto md:max-h-none md:overflow-visible">
      {groups.map((group) => (
        <div key={group.title} className="mb-3">
          <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-faint">
            {group.title}
          </p>
          <div className="flex flex-wrap gap-1 md:flex-col">
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
        </div>
      ))}
    </nav>
  );
}
