import { prisma } from '@/lib/prisma';
import { formatMoney } from '@/lib/commerce/money';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = {
  REGISTRADO: 'Registrado',
  RESERVA: 'Reservó',
  PAGO_COMPLETO: 'Socio (pago completo)',
};

// Programa de referidos: quién invitó a quién, estado y saldo generado.
export default async function AdminReferidos() {
  const [referrals, totalRewardAgg, converted] = await Promise.all([
    prisma.referral.findMany({
      orderBy: { createdAt: 'desc' },
      take: 300,
      select: {
        id: true,
        status: true,
        rewardGrantedCents: true,
        createdAt: true,
        referrer: { select: { email: true } },
        referredUser: { select: { email: true } },
        referralCode: { select: { code: true } },
      },
    }),
    prisma.referral.aggregate({ _sum: { rewardGrantedCents: true } }),
    prisma.referral.count({ where: { status: 'PAGO_COMPLETO' } }),
  ]);

  // Top referidores (por nº de invitados) entre los recientes.
  const byReferrer = new Map<string, { count: number; reward: number }>();
  for (const r of referrals) {
    const key = r.referrer?.email ?? '—';
    const cur = byReferrer.get(key) ?? { count: 0, reward: 0 };
    cur.count += 1;
    cur.reward += r.rewardGrantedCents;
    byReferrer.set(key, cur);
  }
  const topReferrers = [...byReferrer.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 8);

  const total = referrals.length;
  const rewardCents = totalRewardAgg._sum.rewardGrantedCents ?? 0;
  const conv = total > 0 ? Math.round((converted / total) * 100) : 0;
  const fmtDate = (d: Date) => new Intl.DateTimeFormat('es', { dateStyle: 'short' }).format(d);

  const Card = ({ value, label, cls }: { value: string | number; label: string; cls?: string }) => (
    <div className="rounded-card border border-border bg-surface p-4 text-center">
      <div className={`font-display text-2xl ${cls ?? 'text-foreground'}`}>{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-faint">{label}</div>
    </div>
  );

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-foreground">Referidos</h1>
      <p className="mt-1 text-sm text-muted">Invitaciones, conversión y saldo generado (recompensa al pago completo del referido).</p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card value={total} label="Referidos (recientes)" />
        <Card value={converted} label="Convertidos a socio" cls="text-silver" />
        <Card value={`${conv}%`} label="Conversión" cls="text-gold-light" />
        <Card value={formatMoney(rewardCents, 'EUR', 'es')} label="Saldo generado" cls="text-gold-light" />
      </div>

      {topReferrers.length > 0 ? (
        <div className="mt-6">
          <h2 className="font-display text-lg text-gold-light">Top referidores</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {topReferrers.map(([email, s]) => (
              <span key={email} className="rounded-full border border-border px-3 py-1 text-xs text-muted">
                {email}: <span className="text-foreground">{s.count}</span>
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-6 overflow-x-auto rounded-card border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wider text-faint">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Referidor</th>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Invitado</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {referrals.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-muted">Aún no hay referidos.</td></tr>
            ) : (
              referrals.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-3 text-muted">{fmtDate(r.createdAt)}</td>
                  <td className="px-4 py-3 text-foreground">{r.referrer?.email ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-gold-light">{r.referralCode?.code ?? '—'}</td>
                  <td className="px-4 py-3 text-muted">{r.referredUser?.email ?? '—'}</td>
                  <td className={`px-4 py-3 ${r.status === 'PAGO_COMPLETO' ? 'text-silver' : 'text-muted'}`}>{STATUS_LABEL[r.status] ?? r.status}</td>
                  <td className="px-4 py-3 text-gold-light">{r.rewardGrantedCents > 0 ? formatMoney(r.rewardGrantedCents, 'EUR', 'es') : '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
