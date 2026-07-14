import { getAmbassadorConfig, isAmbassadorProgramEnabled } from '@/lib/ambassador/config';
import { updateAmbassadorConfigAction } from '@/lib/admin-actions';

export const dynamic = 'force-dynamic';

const inp = 'rounded border border-border bg-background px-2 py-1.5 text-foreground';

export default async function AmbassadorConfig({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const sp = await searchParams;
  const [cfg, enabled] = await Promise.all([getAmbassadorConfig(), isAmbassadorProgramEnabled()]);
  const eur = (cents: number) => (cents / 100).toFixed(2);

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-bold text-foreground">Configuración · Embajadores</h1>
      <p className="mt-1 text-sm text-muted">Parámetros del programa (Bases VER 5). El importe funciona igual en EUR o USD.</p>

      {sp.saved ? (
        <p className="mt-3 rounded border border-green-500/40 bg-green-500/10 px-4 py-2 text-sm text-green-300">✓ Configuración guardada.</p>
      ) : null}

      <form action={updateAmbassadorConfigAction} className="mt-4 space-y-5 rounded-card border border-border bg-surface p-5">
        <label className={`flex items-center gap-3 rounded border p-3 ${enabled ? 'border-green-500/40 bg-green-500/5' : 'border-gold/40 bg-gold/5'}`}>
          <input type="checkbox" name="enabled" defaultChecked={enabled} className="h-4 w-4" />
          <span className="text-sm text-foreground">
            <strong>Programa activo</strong> — mientras esté desactivado no se captura ningún código ni se aplica descuento en el checkout.
          </span>
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block"><span className="text-xs text-muted">Recompensa por alta Prime (€/$)</span>
            <input name="rewardPrimeCents" defaultValue={eur(cfg.rewardPrimeCents)} className={`mt-1 w-full ${inp}`} /></label>
          <label className="block"><span className="text-xs text-muted">Recompensa por alta Prestige (€/$)</span>
            <input name="rewardPrestigeCents" defaultValue={eur(cfg.rewardPrestigeCents)} className={`mt-1 w-full ${inp}`} /></label>
          <label className="block"><span className="text-xs text-muted">Extra crédito en tienda (%)</span>
            <input name="creditBonusPct" type="number" defaultValue={cfg.creditBonusPct} className={`mt-1 w-full ${inp}`} /></label>
          <label className="block"><span className="text-xs text-muted">Retención mínima (días)</span>
            <input name="retentionDays" type="number" defaultValue={cfg.retentionDays} className={`mt-1 w-full ${inp}`} /></label>
          <label className="block"><span className="text-xs text-muted">Umbral de cobro post-campaña (€/$)</span>
            <input name="payoutThresholdCents" defaultValue={eur(cfg.payoutThresholdCents)} className={`mt-1 w-full ${inp}`} /></label>
          <label className="block"><span className="text-xs text-muted">Factura propia del embajador a partir de (€/$)</span>
            <input name="ownInvoiceAboveCents" defaultValue={eur(cfg.ownInvoiceAboveCents)} className={`mt-1 w-full ${inp}`} /></label>
          <label className="block"><span className="text-xs text-muted">Reactivación del código (meses)</span>
            <input name="reactivateMonths" type="number" defaultValue={cfg.reactivateMonths} className={`mt-1 w-full ${inp}`} /></label>
          <label className="block"><span className="text-xs text-muted">Cookie de atribución (días)</span>
            <input name="attributionCookieDays" type="number" defaultValue={cfg.attributionCookieDays} className={`mt-1 w-full ${inp}`} /></label>
          <label className="block"><span className="text-xs text-muted">Reserva de nº de socio sin pagar (horas)</span>
            <input name="numberHoldHours" type="number" defaultValue={cfg.numberHoldHours} className={`mt-1 w-full ${inp}`} /></label>
        </div>

        <p className="text-[11px] text-faint">
          Reparto por modelo (fijo): A 100/0 · B 0/100 · C 50/50 (embajador/cliente). El referido de socio usa 50/50 en crédito.
        </p>
        <button className="bevel bg-gold px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#1a1408]">Guardar configuración</button>
      </form>
    </div>
  );
}
