import { prisma } from '@/lib/prisma';

export default async function AdminAuditoria() {
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-foreground">Auditoría</h1>
      <p className="mt-1 text-sm text-muted">{logs.length} eventos recientes</p>
      <div className="mt-6 overflow-x-auto rounded-card border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wider text-faint">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Acción</th>
              <th className="px-4 py-3">Entidad</th>
              <th className="px-4 py-3">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted">
                  Sin eventos todavía.
                </td>
              </tr>
            ) : (
              logs.map((l) => (
                <tr key={l.id} className="border-t border-border">
                  <td className="px-4 py-3 text-muted">
                    {new Intl.DateTimeFormat('es', { dateStyle: 'short', timeStyle: 'short' }).format(l.createdAt)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-foreground">{l.action}</td>
                  <td className="px-4 py-3 text-muted">
                    {l.entity}
                    {l.entityId ? <span className="text-faint"> #{l.entityId.slice(0, 8)}</span> : null}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gold-light">
                    {l.newValue ? JSON.stringify(l.newValue).slice(0, 80) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
