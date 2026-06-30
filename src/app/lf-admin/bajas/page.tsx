import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const REASON_LABELS: Record<string, string> = {
  price: 'Precio alto',
  dont_use: 'No lo usa',
  content: 'Contenido',
  found_alt: 'Alternativa',
  temporary: 'Temporal',
  other: 'Otro',
};

// Bajas y retención: encuesta recogida al cancelar/bajar de nivel (doc usuario).
export default async function AdminBajas() {
  const feedback = await prisma.cancellationFeedback.findMany({
    orderBy: { createdAt: 'desc' },
    take: 300,
  });

  // Datos de usuario (no hay relación Prisma directa: se resuelven por id).
  const userIds = [...new Set(feedback.map((f) => f.userId))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } },
  });
  const byId = new Map(users.map((u) => [u.id, u]));

  const downgraded = feedback.filter((f) => f.outcome === 'downgraded').length;
  const cancelled = feedback.filter((f) => f.outcome === 'cancelled').length;
  const reasonCounts = feedback.reduce<Record<string, number>>((acc, f) => {
    const k = f.reason ?? 'sin_motivo';
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
  const topReasons = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]);
  const fmtDate = (d: Date) => new Date(d).toISOString().slice(0, 10);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-foreground">Bajas y retención</h1>
      <p className="mt-1 text-sm text-muted">
        Encuesta recogida cuando un socio baja de nivel o cancela la suscripción.
      </p>

      {/* Resumen */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-card border border-border bg-surface p-4 text-center">
          <div className="font-display text-2xl text-foreground">{feedback.length}</div>
          <div className="text-[11px] uppercase tracking-wider text-faint">Total</div>
        </div>
        <div className="rounded-card border border-border bg-surface p-4 text-center">
          <div className="font-display text-2xl text-gold-light">{downgraded}</div>
          <div className="text-[11px] uppercase tracking-wider text-faint">Bajaron a Prime</div>
        </div>
        <div className="rounded-card border border-border bg-surface p-4 text-center">
          <div className="font-display text-2xl text-red-400">{cancelled}</div>
          <div className="text-[11px] uppercase tracking-wider text-faint">Cancelaron</div>
        </div>
        <div className="rounded-card border border-border bg-surface p-4 text-center">
          <div className="font-display text-2xl text-foreground">
            {feedback.length ? Math.round((downgraded / feedback.length) * 100) : 0}%
          </div>
          <div className="text-[11px] uppercase tracking-wider text-faint">Retención (downgrade)</div>
        </div>
      </div>

      {/* Motivos */}
      {topReasons.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {topReasons.map(([k, n]) => (
            <span key={k} className="rounded-full border border-border px-3 py-1 text-xs text-muted">
              {REASON_LABELS[k] ?? k}: <span className="text-foreground">{n}</span>
            </span>
          ))}
        </div>
      ) : null}

      {/* Detalle */}
      <div className="mt-6 overflow-x-auto rounded-card border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wider text-faint">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Socio</th>
              <th className="px-4 py-3">Desde</th>
              <th className="px-4 py-3">Resultado</th>
              <th className="px-4 py-3">Motivo</th>
              <th className="px-4 py-3">Comentario</th>
            </tr>
          </thead>
          <tbody>
            {feedback.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted">
                  Aún no hay bajas registradas.
                </td>
              </tr>
            ) : (
              feedback.map((f) => {
                const u = byId.get(f.userId);
                const name = u?.profile ? `${u.profile.firstName} ${u.profile.lastName}` : (u?.email ?? '—');
                return (
                  <tr key={f.id} className="border-t border-border align-top">
                    <td className="px-4 py-3 text-muted">{fmtDate(f.createdAt)}</td>
                    <td className="px-4 py-3 text-foreground">
                      {name}
                      {u?.email ? <span className="block text-[11px] text-faint">{u.email}</span> : null}
                    </td>
                    <td className="px-4 py-3 text-muted">{f.fromClub ?? '—'}</td>
                    <td className={`px-4 py-3 ${f.outcome === 'downgraded' ? 'text-gold-light' : 'text-red-400'}`}>
                      {f.outcome === 'downgraded' ? 'Bajó a Prime' : 'Canceló'}
                    </td>
                    <td className="px-4 py-3 text-muted">{f.reason ? (REASON_LABELS[f.reason] ?? f.reason) : '—'}</td>
                    <td className="px-4 py-3 text-muted">{f.comment ?? '—'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
