'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type AdminNavItem = { href: string; label: string };

export function AdminNav({ items }: { items: AdminNavItem[] }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/lf-admin' ? pathname === '/lf-admin' : pathname.startsWith(href);

  return (
    <nav className="mt-6 flex max-h-40 flex-wrap gap-2 overflow-y-auto md:max-h-none md:flex-col md:gap-1 md:overflow-visible">
      {items.map((n) => {
        const active = isActive(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? 'page' : undefined}
            className={`rounded px-3 py-2 text-sm transition ${
              active
                ? 'border-l-2 border-gold bg-gold/10 font-semibold text-gold-light'
                : 'border-l-2 border-transparent text-muted hover:bg-surface-elevated hover:text-foreground'
            }`}
          >
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
