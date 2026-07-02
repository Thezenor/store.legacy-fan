import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/admin';
import { AdminNav } from '@/components/admin/admin-nav';
import { AdminBottomNav } from '@/components/admin/admin-bottom-nav';
import '../globals.css';
import '@fontsource/spectral/400.css';
import '@fontsource/spectral/600.css';
import '@fontsource/cinzel/600.css';
import '@fontsource/cinzel/700.css';

export const metadata: Metadata = {
  title: 'Legacy Fan · Superadmin',
  robots: { index: false, follow: false },
};

// Navegación agrupada por áreas (mejor organización que una lista plana).
const NAV_GROUPS = [
  {
    title: 'Panel',
    items: [{ href: '/lf-admin', label: 'Dashboard' }],
  },
  {
    title: 'Socios',
    items: [
      { href: '/lf-admin/registros', label: 'Registros' },
      { href: '/lf-admin/socios', label: 'Socios' },
      { href: '/lf-admin/numeracion', label: 'Numeración' },
      { href: '/lf-admin/suscripciones', label: 'Suscripciones' },
      { href: '/lf-admin/referidos', label: 'Referidos' },
      { href: '/lf-admin/bajas', label: 'Bajas y retención' },
      { href: '/lf-admin/carnet', label: 'Carnet y Wallet' },
    ],
  },
  {
    title: 'Ventas',
    items: [
      { href: '/lf-admin/pagos', label: 'Reservas y pagos' },
      { href: '/lf-admin/pedidos', label: 'Pedidos y envíos' },
    ],
  },
  {
    title: 'Catálogo',
    items: [
      { href: '/lf-admin/clubs', label: 'Clubs' },
      { href: '/lf-admin/colecciones', label: 'Colecciones' },
      { href: '/lf-admin/productos', label: 'Productos' },
      { href: '/lf-admin/fases', label: 'Fases y precios' },
    ],
  },
  {
    title: 'Contenido',
    items: [
      { href: '/lf-admin/emails', label: 'Emails' },
      { href: '/lf-admin/emails/log', label: 'Log de correos' },
      { href: '/lf-admin/faq', label: 'FAQ' },
      { href: '/lf-admin/legal', label: 'Legal' },
      { href: '/lf-admin/seo', label: 'SEO / GEO' },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { href: '/lf-admin/config', label: 'Configuración' },
      { href: '/lf-admin/roles', label: 'Roles' },
      { href: '/lf-admin/ajustes', label: 'Ajustes (avanzado)' },
      { href: '/lf-admin/auditoria', label: 'Auditoría' },
    ],
  },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { session, roles } = await requireAdmin();

  return (
    <html lang="es" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <div className="grid min-h-screen grid-cols-1 md:grid-cols-[248px_1fr]">
          {/* Sidebar */}
          <aside className="flex flex-col border-b border-border bg-surface p-5 md:border-b-0 md:border-r">
            <div className="font-display text-lg font-semibold tracking-[0.16em] text-metal-gold">
              LEGACY FAN
            </div>
            <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-faint">Superadmin</p>
            <AdminNav groups={NAV_GROUPS} />
            <AdminBottomNav />
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
