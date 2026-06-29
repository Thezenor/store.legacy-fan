import { prisma } from '@/lib/prisma';
import { updatePhaseAction } from '@/lib/admin-actions';

// Editor de fases globales (doc 09): precios EUR/USD por fase + activar/forzar estado.
export default async function AdminFases() {
  const plans = await prisma.membershipPlan.findMany({
    include: { phases: { orderBy: { sortOrder: 'asc' } } },
    orderBy: { club: 'asc' },
  });

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-foreground">Fases y precios</h1>
      <p className="mt-1 text-sm text-muted">
        Precios en EUR/USD por fase. “Activa” marca la fase vigente; “Forzar” fija el estado
        ignorando las fechas.
      </p>

      {plans.map((plan) => (
        <section key={plan.id} className="mt-8">
          <h2 className="font-display text-xl text-gold-light">{plan.name}</h2>
          <div className="mt-3 space-y-3">
            {plan.phases.map((ph) => (
              <form
                key={ph.id}
                action={updatePhaseAction}
                className="flex flex-wrap items-end gap-3 rounded-card border border-border bg-surface p-4"
              >
                <input type="hidden" name="phaseId" value={ph.id} />
                <div className="w-24">
                  <div className="text-xs uppercase tracking-wider text-faint">Fase</div>
                  <div className="mt-1 text-foreground">{ph.name}</div>
                </div>
                <label className="block">
                  <span className="text-xs text-muted">Precio EUR</span>
                  <input
                    name="priceEur"
                    type="number"
                    step="0.01"
                    defaultValue={(ph.priceEurCents / 100).toFixed(2)}
                    className="mt-1 w-28 rounded border border-border bg-background px-2 py-1.5 text-foreground"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-muted">Precio USD</span>
                  <input
                    name="priceUsd"
                    type="number"
                    step="0.01"
                    defaultValue={(ph.priceUsdCents / 100).toFixed(2)}
                    className="mt-1 w-28 rounded border border-border bg-background px-2 py-1.5 text-foreground"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-muted">
                  <input type="checkbox" name="isActive" defaultChecked={ph.isActive} /> Activa
                </label>
                <label className="flex items-center gap-2 text-sm text-muted">
                  <input type="checkbox" name="forcedState" defaultChecked={ph.forcedState} /> Forzar
                </label>
                <button
                  type="submit"
                  className="rounded bg-gold-grad px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#160f02] transition hover:brightness-110"
                >
                  Guardar
                </button>
              </form>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
