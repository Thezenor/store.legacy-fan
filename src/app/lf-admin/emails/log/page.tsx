import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getSettingString } from '@/lib/commerce/settings';

export const dynamic = 'force-dynamic';

// Log de correos: historial de envíos con resumen, para operar el servicio
// (detectar fallos de entrega, verificar el proveedor activo, etc.).
export default async function AdminEmailLog() {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [logs, total, ok, failed, last24h, provider] = await Promise.all([
    prisma.emailLog.findMany({ orderBy: { createdAt: 'desc' }, take: 300 }),
    prisma.emailLog.count(),
    prisma.emailLog.count({ where: { success: true } }),
    prisma.emailLog.count({ where: { success: false } }),
    prisma.emailLog.count({ where: { createdAt: { gte: since24h } } }),
    getSettingString('email.provider'),
  ]);

  const rate = total > 0 ? Math.round((ok / total) * 100) : 0;
  const fmt = (d: Date) => new Intl.DateTimeFormat('es', { dateStyle: 'short', timeStyle: 'short' }).format(d);

  const Card = ({ value, label, cls }: { value: string | number; label: string; cls?: string }) => (
    <div className="rounded-card border border-border bg-surface p-4 text-center">
      <div className={`font-display text-2xl ${cls ?? 'text-foreground'}`}>{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-faint">{label}</div>
    </div>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-3xl font-bold text-foreground">Log de correos</h1>
        <Link href="/lf-admin/emails" className="text-sm text-muted hover:text-foreground">← Plantillas de email</Link>
      </div>
      <p className="mt-1 text-sm text-muted">
        Proveedor activo: <span className="text-gold-light">{provider || 'consola (pruebas)'}</span>. Historial de los últimos 300 envíos.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Card value={total} label="Total" />
        <Card value={ok} label="Entregados" cls="text-silver" />
        <Card value={failed} label="Fallidos" cls={failed > 0 ? 'text-red-400' : 'text-foreground'} />
        <Card value={`${rate}%`} label="Tasa de éxito" cls="text-gold-light" />
        <Card value={last24h} label="Últimas 24 h" />
      </div>

      <div className="mt-6 overflow-x-auto rounded-card border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wider text-faint">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Destinatario</th>
              <th className="px-4 py-3">Proveedor</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-muted">Sin envíos registrados.</td></tr>
            ) : (
              logs.map((l) => (
                <tr key={l.id} className="border-t border-border align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{fmt(l.createdAt)}</td>
                  <td className="px-4 py-3 text-foreground">{l.toEmail}</td>
                  <td className="px-4 py-3 text-muted">{l.provider}</td>
                  <td className={`px-4 py-3 ${l.success ? 'text-silver' : 'text-red-400'}`}>
                    {l.success ? 'OK' : 'Fallo'}
                  </td>
                  <td className="px-4 py-3 text-muted">{l.error ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
