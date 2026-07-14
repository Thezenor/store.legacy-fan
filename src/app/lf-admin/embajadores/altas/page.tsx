import { prisma } from '@/lib/prisma';
import { formatMoney } from '@/lib/commerce/money';
import { validateAmbassadorSignupsAction } from '@/lib/admin-actions';

export const dynamic = 'force-dynamic';

const fmtDate = (d: Date | null) => (d ? new Intl.DateTimeFormat('es', { dateStyle: 'short' }).format(d) : '—');
const STATE_LABEL: Record<string, string> = {
  RESERVADA: 'Reservada', PAGADA: 'Pagada', EN_RETENCION: 'En retención', VALIDADA: 'Validada',
  LIQUIDADA: 'Liquidada', REVERTIDA: 'Revertida', CANCELADA: 'Cancelada', EN_REVISION: 'En revisión',
};

export default async function AmbassadorSignups({
  searchParams,
}: {
  searchParams: Promise<{ validated?: string }>;
}) {
  const sp = await searchParams;
  const signups = await prisma.ambassadorSignup.findMany({
    orderBy: { createdAt: 'desc' },
    take: 300,
    include: { ambassador: { select: { code: true } } },
  });

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold text-foreground">Altas con código</h1>
        <form action={validateAmbassadorSignupsAction}>
          <button className="border border-gold/40 px-3 py-1.5 text-xs uppercase tracking-wider text-gold-light hover:bg-surface-elevated">
            Validar altas con retención cumplida
          </button>
        </form>
      </div>
      <p className="mt-1 text-sm text-muted">{signups.length} altas (últimas 300). Se alimentan solas desde los pedidos.</p>

      {sp.validated ? (
        <p className="mt-3 rounded border border-green-500/40 bg-green-500/10 px-4 py-2 text-sm text-green-300">✓ {sp.validated} altas pasadas a Validada.</p>
      ) : null}

      <div className="mt-4 overflow-x-auto rounded-card border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wider text-faint">
            <tr>
              <th className="px-3 py-3">Fecha</th><th className="px-3 py-3">Código</th><th className="px-3 py-3">Tipo</th>
              <th className="px-3 py-3">Plan</th><th className="px-3 py-3">Divisa</th><th className="px-3 py-3">Estado</th>
              <th className="px-3 py-3">Modelo</th><th className="px-3 py-3">Recompensa</th><th className="px-3 py-3">Descuento</th>
              <th className="px-3 py-3">Fin retención</th><th className="px-3 py-3">Válida</th>
            </tr>
          </thead>
          <tbody>
            {signups.length === 0 ? (
              <tr><td colSpan={11} className="px-3 py-6 text-center text-muted">Aún no hay altas con código.</td></tr>
            ) : signups.map((s) => (
              <tr key={s.id} className="border-t border-border/60">
                <td className="px-3 py-2 text-muted">{fmtDate(s.createdAt)}</td>
                <td className="px-3 py-2"><span className="serial text-gold-light">{s.ambassador?.code ?? s.code}</span></td>
                <td className="px-3 py-2 text-muted">{s.codeType === 'MEMBER' ? 'socio' : 'embajador'}{s.selfPurchase ? ' · auto' : ''}</td>
                <td className="px-3 py-2 text-foreground">{s.plan ?? '—'}</td>
                <td className="px-3 py-2 text-muted">{s.currency}</td>
                <td className="px-3 py-2 text-foreground">{STATE_LABEL[s.state] ?? s.state}</td>
                <td className="px-3 py-2 text-muted">{s.model ?? '—'}</td>
                <td className="px-3 py-2 text-foreground">{s.rewardCents ? formatMoney(s.rewardCents, s.currency, 'es') : '—'}</td>
                <td className="px-3 py-2 text-muted">{s.discountCents ? formatMoney(s.discountCents, s.currency, 'es') : '—'}</td>
                <td className="px-3 py-2 text-muted">{fmtDate(s.retentionUntil)}</td>
                <td className={`px-3 py-2 ${s.valid ? 'text-state-green' : 'text-faint'}`}>{s.valid ? 'sí' : 'no'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
