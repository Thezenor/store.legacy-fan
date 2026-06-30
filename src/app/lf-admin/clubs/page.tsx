import { prisma } from '@/lib/prisma';
import { updateClubAction, createClubAction } from '@/lib/admin-actions';

const inp = 'mt-1 rounded border border-border bg-background px-2 py-1.5 text-foreground';

export default async function AdminClubs() {
  const plans = await prisma.membershipPlan.findMany({ orderBy: { club: 'asc' } });
  const dateVal = (d: Date | null) => (d ? new Date(d).toISOString().slice(0, 10) : '');
  const money = (c: number | null) => (c != null ? (c / 100).toFixed(2) : '');

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-bold text-foreground">Clubs</h1>
      <p className="mt-1 text-sm text-muted">
        Activa/desactiva un club (se muestra u oculta en la web) y configura su lanzamiento y reserva
        propios. Los precios por fase están en “Fases y precios”.
      </p>

      {/* Crear club nuevo */}
      <form action={createClubAction} className="mt-4 flex flex-wrap items-end gap-3 rounded-card border border-gold/30 bg-surface p-4">
        <label className="block"><span className="text-xs text-muted">Nombre del club</span>
          <input name="name" required className={`${inp} w-48`} /></label>
        <label className="block"><span className="text-xs text-muted">Código (opcional)</span>
          <input name="code" placeholder="FOUNDERS" className={`${inp} w-32`} /></label>
        <label className="block flex-1"><span className="text-xs text-muted">Lema</span>
          <input name="tagline" className={`${inp} w-full`} /></label>
        <label className="block"><span className="text-xs text-muted">Precio EUR</span>
          <input name="priceEur" type="number" step="0.01" defaultValue="0" className={`${inp} w-24`} /></label>
        <label className="block"><span className="text-xs text-muted">Precio USD</span>
          <input name="priceUsd" type="number" step="0.01" defaultValue="0" className={`${inp} w-24`} /></label>
        <label className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" name="active" /> Activo</label>
        <button className="bevel bg-gold px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#1a1408]">Crear club</button>
      </form>

      <div className="mt-6 space-y-4">
        {plans.map((p) => (
          <form key={p.id} action={updateClubAction} className="rounded-card border border-border bg-surface p-5">
            <input type="hidden" name="id" value={p.id} />
            <div className="flex items-center justify-between">
              <span className="font-display text-lg text-gold-light">{p.club}</span>
              <label className="flex items-center gap-2 text-sm text-muted">
                <input type="checkbox" name="active" defaultChecked={p.active} /> Activo (visible en la web)
              </label>
            </div>
            <div className="mt-3 flex flex-wrap gap-4">
              <label className="block"><span className="text-xs text-muted">Nombre</span>
                <input name="name" defaultValue={p.name} className={`${inp} w-56`} /></label>
              <label className="block flex-1"><span className="text-xs text-muted">Lema (tagline)</span>
                <input name="tagline" defaultValue={p.tagline ?? ''} className={`${inp} w-full`} /></label>
            </div>
            <div className="mt-3 flex flex-wrap gap-4">
              <label className="block"><span className="text-xs text-muted">Fecha de lanzamiento</span>
                <input type="date" name="launchDate" defaultValue={dateVal(p.launchDate)} className={inp} /></label>
              <label className="block"><span className="text-xs text-muted">Reserva EUR (vacío = global)</span>
                <input name="reservationEur" type="number" step="0.01" defaultValue={money(p.reservationEurCents)} className={`${inp} w-28`} /></label>
              <label className="block"><span className="text-xs text-muted">Reserva USD</span>
                <input name="reservationUsd" type="number" step="0.01" defaultValue={money(p.reservationUsdCents)} className={`${inp} w-28`} /></label>
            </div>
            <button className="bevel mt-4 bg-gold px-5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#1a1408]">Guardar club</button>
          </form>
        ))}
      </div>
    </div>
  );
}
