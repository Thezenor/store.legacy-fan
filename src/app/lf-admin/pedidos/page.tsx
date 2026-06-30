import { prisma } from '@/lib/prisma';
import { updateOrderItemStatusAction, createShipmentAction } from '@/lib/admin-actions';

const ITEM_STATUSES = [
  'PENDIENTE_DE_LANZAMIENTO', 'PENDIENTE_DE_PRODUCCION', 'PENDIENTE_DE_RECEPCION',
  'EN_PREPARACION', 'ENVIADO_PARCIALMENTE', 'ENVIADO', 'ENTREGADO', 'CANCELADO',
  'REEMBOLSADO', 'INCIDENCIA',
];
const inp = 'rounded border border-border bg-background px-2 py-1.5 text-foreground';

export default async function AdminPedidos() {
  const orders = await prisma.order.findMany({
    include: { items: true, shipments: true, user: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl font-bold text-foreground">Pedidos y envíos</h1>
      <p className="mt-1 text-sm text-muted">{orders.length} pedidos</p>

      <div className="mt-6 space-y-4">
        {orders.length === 0 ? (
          <p className="text-sm text-muted">Aún no hay pedidos.</p>
        ) : orders.map((o) => (
          <div key={o.id} className="rounded-card border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">{o.user.email}</span>
              <span className="serial text-xs">{o.items.length} items · {o.shipments.length} envíos</span>
            </div>
            <div className="mt-3 space-y-2">
              {o.items.map((it) => (
                <form key={it.id} action={updateOrderItemStatusAction} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="itemId" value={it.id} />
                  <span className="min-w-0 flex-1 truncate text-sm text-muted">{it.name}</span>
                  <select name="status" defaultValue={it.status} className={`text-xs ${inp}`}>
                    {ITEM_STATUSES.map((s) => <option key={s} value={s}>{s.replaceAll('_', ' ').toLowerCase()}</option>)}
                  </select>
                  <button type="submit" className="border border-gold/40 px-2 py-1 text-[11px] uppercase tracking-wider text-gold-light hover:bg-surface-elevated">OK</button>
                </form>
              ))}
            </div>
            {/* Crear envío con tracking */}
            <form action={createShipmentAction} className="mt-3 flex flex-wrap items-end gap-2 border-t border-border pt-3">
              <input type="hidden" name="orderId" value={o.id} />
              <input name="carrier" placeholder="Transportista" className={`text-xs ${inp}`} />
              <input name="tracking" placeholder="Tracking" className={`text-xs ${inp}`} />
              <button type="submit" className="bevel bg-gold px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1a1408]">Marcar enviado</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
