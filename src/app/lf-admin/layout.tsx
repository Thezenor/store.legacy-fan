import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
import '../globals.css';
import '@fontsource/hanken-grotesk/400.css';
import '@fontsource/hanken-grotesk/600.css';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/600.css';

export const metadata: Metadata = {
  title: 'Legacy Fan · Superadmin',
  robots: { index: false, follow: false },
};

const NAV = [
  { href: '/lf-admin', label: 'Dashboard' },
  { href: '/lf-admin/socios', label: 'Socios' },
  { href: '/lf-admin/pagos', label: 'Reservas y pagos' },
  { href: '/lf-admin/colecciones', label: 'Colecciones' },
  { href: '/lf-admin/productos', label: 'Productos' },
  { href: '/lf-admin/fases', label: 'Fases y precios' },
  { href: '/lf-admin/legal', label: 'Legal' },
  { href: '/lf-admin/ajustes', label: 'Ajustes' },
  { href: '/lf-admin/auditoria', label: 'Auditoría' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { session, roles } = await requireAdmin();

  return (
    <html lang="es" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <div className="grid min-h-screen grid-cols-1 md:grid-cols-[248px_1fr]">
          {/* Sidebar */}
          <aside className="border-b border-border bg-surface p-5 md:border-b-0 md:border-r">
            <div className="font-display text-lg font-semibold tracking-[0.16em] text-metal-gold">
              LEGACY FAN
            </div>
            <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-faint">Superadmin</p>
            <nav className="mt-6 flex flex-wrap gap-2 md:flex-col md:gap-1">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="rounded px-3 py-2 text-sm text-muted transition hover:bg-surface-elevated hover:text-foreground"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </aside>

          {/* Contenido */}
          <div className="flex flex-col">
            <header className="flex h-16 items-center justify-between border-b border-border px-6">
              <span className="text-sm text-muted">{session.user.email}</span>
              <span className="rounded-full border border-gold/40 px-3 py-1 text-[11px] uppercase tracking-wider text-gold-light">
                {roles[0]}
              </span>
            </header>
            <main className="flex-1 p-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
