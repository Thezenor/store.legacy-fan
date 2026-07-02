import { prisma } from '@/lib/prisma';
import { formatMoney } from '@/lib/commerce/money';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  ACTIVA: 'Activa',
  CANCELADA: 'Cancelada',
  SUSPENDIDA: 'Suspendida',
};

// Suscripciones de renovación anual (doc usuario): visión de las membresías
// recurrentes, su estado, próximo cobro y bajas programadas.
export default async function AdminSuscripciones() {
  const [subs, active, cancelAtEnd, cancelled] = await Promise.all([
    prisma.subscription.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 300,
      select: {
        id: true,
        status: true,
        club: true,
        provider: true,
        amountCents: true,
        currency: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
        downgradeToClub: true,
        user: { select: { email: true } },
      },
    }),
    prisma.subscription.count({ where: { status: 'ACTIVA' } }),
    prisma.subscription.count({ where: { cancelAtPeriodEnd: true } }),
    prisma.subscription.count({ where: { status: 'CANCELADA' } }),
  ]);

  const fmtDate = (d: Date | null) =>
    d ? new Intl.DateTimeFormat('es', { dateStyle: 'medium' }).format(d) : '—';

  const Card = ({ value, label, cls }: { value: number; label: string; cls?: string }) => (
    <div className="rounded-card border border-border bg-surface p-4 text-center">
      <div className={`font-display text-2xl ${cls ?? 'text-foreground'}`}>{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-faint">{label}</div>
    </div>
  );

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-foreground">Suscripciones</h1>
      <p className="mt-1 text-sm text-muted">Renovación anual recurrente de las membresías.</p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card value={subs.length} label="Total (recientes)" />
        <Card value={active} label="Activas" cls="text-silver" />
        <Card value={cancelAtEnd} label="Cancelan al vencer" cls="text-gold-light" />
        <Card value={cancelled} label="Canceladas" cls="text-red-400" />
      </div>

      <div className="mt-6 overflow-x-auto rounded-card border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wider text-faint">
            <tr>
              <th className="px-4 py-3">Socio</th>
              <th className="px-4 py-3">Club</th>
              <th className="px-4 py-3">Importe/año</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Próxima renovación</th>
              <th className="px-4 py-3">Pasarela</th>
            </tr>
          </thead>
          <tbody>
            {subs.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-muted">Aún no hay suscripciones.</td></tr>
            ) : (
              subs.map((s) => (
                <tr key={s.id} className="border-t border-border align-top">
                  <td className="px-4 py-3 text-foreground">{s.user?.email ?? '—'}</td>
                  <td className="px-4 py-3 text-muted">
                    {s.club}
                    {s.downgradeToClub ? <span className="block text-[11px] text-gold-light">→ {s.downgradeToClub}</span> : null}
                  </td>
                  <td className="px-4 py-3 text-muted">{formatMoney(s.amountCents, s.currency, 'es')}</td>
                  <td className={`px-4 py-3 ${s.status === 'ACTIVA' ? 'text-silver' : s.status === 'CANCELADA' ? 'text-red-400' : 'text-muted'}`}>
                    {STATUS_LABEL[s.status] ?? s.status}
                    {s.cancelAtPeriodEnd ? <span className="block text-[11px] text-gold-light">cancela al vencer</span> : null}
                  </td>
                  <td className="px-4 py-3 text-muted">{fmtDate(s.currentPeriodEnd)}</td>
                  <td className="px-4 py-3 text-faint">{s.provider}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
