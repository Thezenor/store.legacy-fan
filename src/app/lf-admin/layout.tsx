import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/admin';
import { AdminNav } from '@/components/admin/admin-nav';
import '../globals.css';
import '@fontsource/spectral/400.css';
import '@fontsource/spectral/600.css';
import '@fontsource/cinzel/600.css';
import '@fontsource/cinzel/700.css';

export const metadata: Metadata = {
  title: 'Legacy Fan · Superadmin',
  robots: { index: false, follow: false },
};

const NAV = [
  { href: '/lf-admin', label: 'Dashboard' },
  { href: '/lf-admin/socios', label: 'Socios' },
  { href: '/lf-admin/numeracion', label: 'Numeración' },
  { href: '/lf-admin/pagos', label: 'Reservas y pagos' },
  { href: '/lf-admin/pedidos', label: 'Pedidos y envíos' },
  { href: '/lf-admin/colecciones', label: 'Colecciones' },
  { href: '/lf-admin/productos', label: 'Productos' },
  { href: '/lf-admin/fases', label: 'Fases y precios' },
  { href: '/lf-admin/emails', label: 'Emails' },
  { href: '/lf-admin/faq', label: 'FAQ' },
  { href: '/lf-admin/seo', label: 'SEO / GEO' },
  { href: '/lf-admin/legal', label: 'Legal' },
  { href: '/lf-admin/roles', label: 'Roles' },
  { href: '/lf-admin/config', label: 'Configuración' },
  { href: '/lf-admin/ajustes', label: 'Ajustes (avanzado)' },
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
            <AdminNav items={NAV} />
          </aside>

          {/* Contenido */}
          <div className="flex flex-col">
            <header className="flex h-16 items-center justify-between gap-3 border-b border-border px-6">
              <span className="min-w-0 truncate text-sm text-muted">{session.user.email}</span>
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
