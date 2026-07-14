import { prisma } from '@/lib/prisma';
import { formatMoney } from '@/lib/commerce/money';
import {
  generateAmbassadorSettlementsAction,
  markAmbassadorSettlementPaidAction,
} from '@/lib/admin-actions';

export const dynamic = 'force-dynamic';

const fmtDate = (d: Date | null) => (d ? new Intl.DateTimeFormat('es', { dateStyle: 'short' }).format(d) : '—');
const inp = 'rounded border border-border bg-background px-2 py-1 text-foreground text-[11px]';

export default async function AmbassadorSettlements({
  searchParams,
}: {
  searchParams: Promise<{ generated?: string; paid?: string }>;
}) {
  const sp = await searchParams;
  const [settlements, pending] = await Promise.all([
    prisma.ambassadorSettlement.findMany({ orderBy: { createdAt: 'desc' }, include: { ambassador: { select: { code: true } } } }),
    // Vista previa de lo pendiente de liquidar (validado no liquidado).
    prisma.ambassadorSignup.groupBy({
      by: ['ambassadorId', 'currency'],
      where: { state: 'VALIDADA', ambassadorId: { not: null } },
      _sum: { rewardCents: true },
      _count: { _all: true },
    }),
  ]);
  const pendingTotal = pending.reduce((a, p) => a + (p._sum.rewardCents ?? 0), 0);

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold text-foreground">Liquidaciones</h1>
        <form action={generateAmbassadorSettlementsAction}>
          <button className="bevel bg-gold px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#1a1408]">
            Generar liquidaciones ({pending.length})
          </button>
        </form>
      </div>
      <p className="mt-1 text-sm text-muted">
        Agrupa las altas validadas por embajador y divisa. La ejecución real del pago (PayPal/transferencia/crédito) la hace el equipo.
      </p>

      {sp.generated ? (
        <p className="mt-3 rounded border border-green-500/40 bg-green-500/10 px-4 py-2 text-sm text-green-300">✓ {sp.generated} liquidaciones generadas.</p>
      ) : null}
      {sp.paid ? (
        <p className="mt-3 rounded border border-green-500/40 bg-green-500/10 px-4 py-2 text-sm text-green-300">✓ Liquidación marcada como pagada.</p>
      ) : null}

      {pending.length > 0 ? (
        <p className="mt-3 text-sm text-muted">Pendiente de liquidar (validado): <span className="text-metal-gold">{pending.length}</span> grupos.</p>
      ) : null}

      <div className="mt-4 overflow-x-auto rounded-card border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wider text-faint">
            <tr>
              <th className="px-3 py-3">Fecha</th><th className="px-3 py-3">Embajador</th><th className="px-3 py-3">Periodo</th>
              <th className="px-3 py-3">Divisa</th><th className="px-3 py-3">Validado</th><th className="px-3 py-3">Método</th>
              <th className="px-3 py-3">+20%</th><th className="px-3 py-3">Total a pagar</th><th className="px-3 py-3">Autofactura</th>
              <th className="px-3 py-3">Estado</th><th className="px-3 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {settlements.length === 0 ? (
              <tr><td colSpan={11} className="px-3 py-6 text-center text-muted">Aún no hay liquidaciones.</td></tr>
            ) : settlements.map((s) => (
              <tr key={s.id} className="border-t border-border/60">
                <td className="px-3 py-2 text-muted">{fmtDate(s.createdAt)}</td>
                <td className="px-3 py-2"><span className="serial text-gold-light">{s.ambassador?.code ?? '—'}</span></td>
                <td className="px-3 py-2 text-muted">{s.period}</td>
                <td className="px-3 py-2 text-muted">{s.currency}</td>
                <td className="px-3 py-2 text-foreground">{formatMoney(s.amountCents, s.currency, 'es')}</td>
                <td className="px-3 py-2 text-muted">{s.method.toLowerCase()}</td>
                <td className="px-3 py-2 text-muted">{s.creditBonusCents ? formatMoney(s.creditBonusCents, s.currency, 'es') : '—'}</td>
                <td className="px-3 py-2 text-foreground">{formatMoney(s.totalPayCents, s.currency, 'es')}</td>
                <td className="px-3 py-2 serial text-xs">{s.invoiceRef ?? (s.notes ? '⚠ factura propia' : '—')}</td>
                <td className={`px-3 py-2 ${s.state === 'PAGADA' ? 'text-state-green' : 'text-muted'}`}>{s.state === 'PAGADA' ? `pagada ${fmtDate(s.paidAt)}` : 'pendiente'}</td>
                <td className="px-3 py-2">
                  {s.state !== 'PAGADA' ? (
                    <form action={markAmbassadorSettlementPaidAction} className="flex items-center gap-1">
                      <input type="hidden" name="id" value={s.id} />
                      <input name="invoiceRef" placeholder="ref." defaultValue={s.invoiceRef ?? ''} className={`w-24 ${inp}`} />
                      <button className="text-[11px] text-gold-light hover:underline">marcar pagada</button>
                    </form>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pendingTotal > 0 ? <p className="mt-2 text-xs text-faint">Total validado pendiente (suma bruta, divisas mezcladas solo visual): {(pendingTotal / 100).toFixed(2)}.</p> : null}
    </div>
  );
}
