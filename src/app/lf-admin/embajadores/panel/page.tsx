import { prisma } from '@/lib/prisma';
import { formatMoney } from '@/lib/commerce/money';

export const dynamic = 'force-dynamic';

type Cur = 'EUR' | 'USD';
const PAID = ['PAGADA', 'EN_RETENCION', 'VALIDADA', 'LIQUIDADA'];

export default async function AmbassadorPanel() {
  const signups = await prisma.ambassadorSignup.findMany({
    include: { ambassador: { select: { code: true, payoutMethod: true } } },
  });

  const n = (pred: (s: (typeof signups)[number]) => boolean) => signups.filter(pred).length;
  const reservas = signups.length;
  const pagados = n((s) => PAID.includes(s.state));
  const validadas = n((s) => s.state === 'VALIDADA');
  const liquidadas = n((s) => s.state === 'LIQUIDADA');
  const enRetencion = n((s) => s.state === 'EN_RETENCION');
  const revertidas = n((s) => s.state === 'REVERTIDA');
  const enRevision = n((s) => s.state === 'EN_REVISION');
  const conv = reservas ? Math.round((pagados / reservas) * 1000) / 10 : 0;

  const byPlan = (p: string) => n((s) => (s.plan ?? '').toUpperCase() === p && PAID.includes(s.state));
  const byModel = (m: string) => n((s) => s.model === m && PAID.includes(s.state));
  const byCur = (c: Cur) => n((s) => s.currency === c && PAID.includes(s.state));

  // Economía por divisa (recompensa/descuento sobre altas devengadas).
  const econ = (c: Cur) => {
    const rows = signups.filter((s) => s.currency === c);
    const sum = (pred: (s: (typeof signups)[number]) => boolean, f: (s: (typeof signups)[number]) => number) =>
      rows.filter(pred).reduce((a, s) => a + f(s), 0);
    return {
      devengada: sum((s) => PAID.includes(s.state), (s) => s.rewardCents),
      descuento: sum((s) => PAID.includes(s.state), (s) => s.discountCents),
      pendiente: sum((s) => s.state === 'VALIDADA', (s) => s.rewardCents),
      liquidado: sum((s) => s.state === 'LIQUIDADA', (s) => s.rewardCents),
      revertido: sum((s) => s.state === 'REVERTIDA', (s) => s.rewardCents),
    };
  };

  // Ranking por embajador (altas válidas + recompensa acumulada + reversión).
  const byAmb = new Map<string, { code: string; valid: number; reward: number; reversed: number; total: number }>();
  for (const s of signups) {
    const code = s.ambassador?.code ?? s.code;
    const r = byAmb.get(code) ?? { code, valid: 0, reward: 0, reversed: 0, total: 0 };
    r.total++;
    if (s.valid) r.valid++;
    if (s.state === 'REVERTIDA') r.reversed++;
    if (PAID.includes(s.state)) r.reward += s.rewardCents;
    byAmb.set(code, r);
  }
  const ranking = [...byAmb.values()].sort((a, b) => b.valid - a.valid || b.reward - a.reward).slice(0, 20);

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex items-center justify-between gap-3 border-b border-border/50 py-1.5 text-sm">
      <span className="text-muted">{label}</span><span className="text-foreground">{value}</span>
    </div>
  );
  const m = (cents: number, c: Cur) => formatMoney(cents, c, 'es');

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-3xl font-bold text-foreground">Panel · Embajadores</h1>
      <p className="mt-1 text-sm text-muted">KPIs en vivo del programa. Todo se calcula desde las altas.</p>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="rounded-card border border-border bg-surface p-4">
          <h2 className="font-display text-lg text-gold-light">Embudo</h2>
          <div className="mt-2">
            <Row label="Reservas registradas" value={reservas} />
            <Row label="Pagos totales" value={pagados} />
            <Row label="Conversión reserva → pago" value={`${conv}%`} />
            <Row label="En retención" value={enRetencion} />
            <Row label="Validadas (pendientes de liquidar)" value={validadas} />
            <Row label="Liquidadas" value={liquidadas} />
            <Row label="Revertidas" value={revertidas} />
            <Row label="En revisión (antifraude)" value={enRevision} />
          </div>
        </section>

        <section className="rounded-card border border-border bg-surface p-4">
          <h2 className="font-display text-lg text-gold-light">Altas válidas / devengadas</h2>
          <div className="mt-2">
            <Row label="Prime" value={byPlan('PRIME')} />
            <Row label="Prestige" value={byPlan('PRESTIGE')} />
            <Row label="Modelo A (Comisión)" value={byModel('A')} />
            <Row label="Modelo B (Descuento)" value={byModel('B')} />
            <Row label="Modelo C (Mixto)" value={byModel('C')} />
            <Row label="En EUR" value={byCur('EUR')} />
            <Row label="En USD" value={byCur('USD')} />
          </div>
        </section>
      </div>

      <section className="mt-4 rounded-card border border-border bg-surface p-4">
        <h2 className="font-display text-lg text-gold-light">Economía por divisa</h2>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-faint"><tr><th className="py-2">Concepto</th><th>EUR</th><th>USD</th></tr></thead>
            <tbody>
              {(['devengada', 'descuento', 'pendiente', 'liquidado', 'revertido'] as const).map((k) => {
                const e = { EUR: econ('EUR'), USD: econ('USD') };
                const LABEL: Record<string, string> = {
                  devengada: 'Recompensa devengada', descuento: 'Descuento a clientes', pendiente: 'Pendiente de liquidar (validado)',
                  liquidado: 'Ya liquidado', revertido: 'Revertido',
                };
                return (
                  <tr key={k} className="border-t border-border/60">
                    <td className="py-1.5 text-muted">{LABEL[k]}</td>
                    <td className="text-foreground">{m(e.EUR[k], 'EUR')}</td>
                    <td className="text-foreground">{m(e.USD[k], 'USD')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-4 rounded-card border border-border bg-surface p-4">
        <h2 className="font-display text-lg text-gold-light">Ranking de embajadores</h2>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-faint"><tr><th className="py-2">Código</th><th>Válidas</th><th>Recompensa</th><th>Revertidas</th><th>Tasa rev.</th></tr></thead>
            <tbody>
              {ranking.length === 0 ? (
                <tr><td colSpan={5} className="py-4 text-center text-muted">Sin datos todavía.</td></tr>
              ) : ranking.map((r) => (
                <tr key={r.code} className="border-t border-border/60">
                  <td className="py-1.5"><span className="serial text-gold-light">{r.code}</span></td>
                  <td className="text-foreground">{r.valid}</td>
                  <td className="text-foreground">{(r.reward / 100).toFixed(2)}</td>
                  <td className="text-muted">{r.reversed}</td>
                  <td className={`${r.total && r.reversed / r.total > 0.15 ? 'text-red-400' : 'text-muted'}`}>{r.total ? Math.round((r.reversed / r.total) * 1000) / 10 : 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
