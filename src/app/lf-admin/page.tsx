import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatMoney } from '@/lib/commerce/money';

const fmtDate = (d: Date) => new Intl.DateTimeFormat('es', { dateStyle: 'short' }).format(d);

export default async function AdminDashboard() {
  const [members, reservations, paidCount, revenueAgg, products, collections, paidPayments, recentMembers] =
    await Promise.all([
      prisma.membership.count({ where: { status: 'SOCIO_ACTIVO' } }),
      prisma.reservation.count({ where: { status: 'RESERVA_PENDIENTE' } }),
      prisma.payment.count({ where: { status: 'PAGO_COMPLETO' } }),
      prisma.payment.aggregate({ where: { status: 'PAGO_COMPLETO', currency: 'EUR' }, _sum: { amountCents: true } }),
      prisma.product.count(),
      prisma.collection.count(),
      prisma.payment.findMany({ where: { status: 'PAGO_COMPLETO' }, orderBy: { createdAt: 'desc' }, take: 500, include: { user: true } }),
      prisma.membership.findMany({ orderBy: { createdAt: 'desc' }, take: 6, include: { user: true, memberNumber: true } }),
    ]);

  // Serie de ventas por mes (últimos 6 meses), en EUR.
  const now = new Date();
  const months: { key: string; label: string; cents: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString('es', { month: 'short' }), cents: 0 });
  }
  for (const pay of paidPayments) {
    if (pay.currency !== 'EUR') continue;
    const d = new Date(pay.createdAt);
    const m = months.find((x) => x.key === `${d.getFullYear()}-${d.getMonth()}`);
    if (m) m.cents += pay.amountCents;
  }
  const maxCents = Math.max(1, ...months.map((m) => m.cents));

  const kpis = [
    { label: 'Socios activos', value: String(members), href: '/lf-admin/socios' },
    { label: 'Reservas activas', value: String(reservations), href: '/lf-admin/pagos' },
    { label: 'Pagos completados', value: String(paidCount), href: '/lf-admin/pagos' },
    { label: 'Ingresos (EUR)', value: formatMoney(revenueAgg._sum.amountCents ?? 0, 'EUR', 'es'), href: '/lf-admin/pagos' },
    { label: 'Productos', value: String(products), href: '/lf-admin/productos' },
    { label: 'Colecciones', value: String(collections), href: '/lf-admin/colecciones' },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
      <p className="mt-1 text-sm text-muted">Resumen de la actividad de Legacy Fan Club.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((k) => (
          <Link key={k.label} href={k.href} className="rounded-card border border-border bg-surface p-5 transition hover:border-gold/40">
            <div className="text-xs uppercase tracking-wider text-faint">{k.label}</div>
            <div className="mt-2 font-display text-3xl font-semibold text-metal-gold">{k.value}</div>
          </Link>
        ))}
      </div>

      {/* Gráfico de ventas (EUR) últimos 6 meses */}
      <div className="mt-6 rounded-card border border-border bg-surface p-5">
        <h2 className="font-display text-lg text-gold-light">Ventas · últimos 6 meses (EUR)</h2>
        <div className="mt-4 flex h-40 items-end gap-3">
          {months.map((m) => (
            <div key={m.key} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex w-full flex-1 items-end">
                <div className="w-full rounded-t bg-gold-grad" style={{ height: `${Math.round((m.cents / maxCents) * 100)}%` }} title={formatMoney(m.cents, 'EUR', 'es')} />
              </div>
              <span className="text-[10px] uppercase text-faint">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Socios recientes */}
      <div className="mt-6 rounded-card border border-border bg-surface p-5">
        <h2 className="font-display text-lg text-gold-light">Socios recientes</h2>
        {recentMembers.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Aún no hay socios.</p>
        ) : (
          <ul className="mt-3 space-y-1 text-sm">
            {recentMembers.map((m) => (
              <li key={m.id} className="flex justify-between gap-3 border-b border-border/60 pb-1">
                <Link href={`/lf-admin/socios/${m.id}`} className="min-w-0 truncate text-gold-light hover:underline">
                  {m.memberNumber?.formatted ?? 's/n'} · {m.user.email}
                </Link>
                <span className="shrink-0 text-xs text-muted">{m.club} · {fmtDate(m.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
