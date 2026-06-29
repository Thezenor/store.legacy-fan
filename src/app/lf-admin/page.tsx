import { prisma } from '@/lib/prisma';
import { formatMoney } from '@/lib/commerce/money';

// Dashboard del superadmin (doc 09): KPIs principales.
export default async function AdminDashboard() {
  const [members, reservations, paidPayments, revenueAgg] = await Promise.all([
    prisma.membership.count({ where: { status: 'SOCIO_ACTIVO' } }),
    prisma.reservation.count({ where: { status: 'RESERVA_PENDIENTE' } }),
    prisma.payment.count({ where: { status: 'PAGO_COMPLETO' } }),
    prisma.payment.aggregate({
      where: { status: 'PAGO_COMPLETO', currency: 'EUR' },
      _sum: { amountCents: true },
    }),
  ]);
  const revenueEur = revenueAgg._sum.amountCents ?? 0;

  const kpis = [
    { label: 'Socios activos', value: String(members) },
    { label: 'Reservas activas', value: String(reservations) },
    { label: 'Pagos completados', value: String(paidPayments) },
    { label: 'Ingresos (EUR)', value: formatMoney(revenueEur, 'EUR', 'es') },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
      <p className="mt-1 text-sm text-muted">Resumen de la actividad de Legacy Fan Club.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-card border border-border bg-surface p-5">
            <div className="text-xs uppercase tracking-wider text-faint">{k.label}</div>
            <div className="mt-2 font-display text-3xl font-semibold text-metal-gold">{k.value}</div>
          </div>
        ))}
      </div>

      <p className="mt-8 text-xs text-muted">
        Gestión completa (CRUD de productos, fases, emails, reembolsos) en próximas iteraciones.
      </p>
    </div>
  );
}
