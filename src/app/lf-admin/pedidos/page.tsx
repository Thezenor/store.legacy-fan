import Link from 'next/link';
import { prisma } from '@/lib/prisma';

const fmtDate = (d: Date) => new Intl.DateTimeFormat('es', { dateStyle: 'short' }).format(d);

export default async function AdminPedidos() {
  const orders = await prisma.order.findMany({
    include: { items: true, shipments: true, user: { include: { profile: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl font-bold text-foreground">Pedidos y envíos</h1>
      <p className="mt-1 text-sm text-muted">{orders.length} pedidos · pulsa uno para gestionarlo</p>

      <div className="mt-6 overflow-x-auto rounded-card border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wider text-faint">
            <tr>
              <th className="px-4 py-3">Pedido</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Envíos</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-muted">Aún no hay pedidos.</td></tr>
            ) : orders.map((o) => (
              <tr key={o.id} className="border-t border-border transition hover:bg-surface-elevated">
                <td className="px-4 py-3">
                  <Link href={`/lf-admin/pedidos/${o.id}`} className="serial text-gold-light hover:underline">#{o.id.slice(-8)}</Link>
                </td>
                <td className="px-4 py-3 text-foreground">
                  {o.user.profile ? `${o.user.profile.firstName} ${o.user.profile.lastName}` : o.user.email}
                </td>
                <td className="px-4 py-3 text-muted">{fmtDate(o.createdAt)}</td>
                <td className="px-4 py-3 text-muted">{o.items.length}</td>
                <td className="px-4 py-3 text-muted">{o.shipments.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
