import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { updateOrderItemStatusAction, createShipmentAction, issueCertificateAction } from '@/lib/admin-actions';

const ITEM_STATUSES = [
  'PENDIENTE_DE_LANZAMIENTO', 'PENDIENTE_DE_PRODUCCION', 'PENDIENTE_DE_RECEPCION',
  'EN_PREPARACION', 'ENVIADO_PARCIALMENTE', 'ENVIADO', 'ENTREGADO', 'CANCELADO',
  'REEMBOLSADO', 'INCIDENCIA',
];
const inp = 'rounded border border-border bg-background px-2 py-1.5 text-foreground';
const fmtDate = (d: Date) => new Intl.DateTimeFormat('es', { dateStyle: 'short', timeStyle: 'short' }).format(d);

export default async function PedidoDetalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { certificate: true } }, shipments: { include: { items: true } }, user: { include: { profile: true, membership: true } } },
  });
  if (!o) notFound();
  const p = o.user.profile;

  return (
    <div className="max-w-2xl">
      <Link href="/lf-admin/pedidos" className="text-sm text-muted hover:text-foreground">← Pedidos</Link>
      <h1 className="mt-2 font-display text-3xl font-bold text-foreground">Pedido <span className="serial">#{o.id.slice(-8)}</span></h1>
      <p className="mt-1 text-sm text-muted">{fmtDate(o.createdAt)} · {o.currency}</p>

      {/* Datos del cliente y envío */}
      <section className="mt-4 rounded-card border border-border bg-surface p-5">
        <h2 className="font-display text-lg text-gold-light">Cliente y envío</h2>
        <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <dt className="text-muted">Cliente</dt>
          <dd className="text-foreground">
            {o.user.membership ? (
              <Link href={`/lf-admin/socios/${o.user.membership.id}`} className="text-gold-light hover:underline">
                {p ? `${p.firstName} ${p.lastName}` : o.user.email}
              </Link>
            ) : (p ? `${p.firstName} ${p.lastName}` : o.user.email)}
          </dd>
          <dt className="text-muted">Email</dt><dd className="text-foreground">{o.user.email}</dd>
          <dt className="text-muted">Teléfono</dt><dd className="text-foreground">{p?.phone ?? '—'}</dd>
          <dt className="text-muted">Dirección</dt>
          <dd className="text-foreground">{[p?.addressLine1, p?.addressLine2, p?.postalCode, p?.city, p?.country].filter(Boolean).join(', ') || '—'}</dd>
        </dl>
      </section>

      {/* Items con estado */}
      <section className="mt-4 rounded-card border border-border bg-surface p-5">
        <h2 className="font-display text-lg text-gold-light">Artículos</h2>
        <div className="mt-3 space-y-2">
          {o.items.map((it) => (
            <div key={it.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-border/50 pb-2">
              <form action={updateOrderItemStatusAction} className="flex flex-1 flex-wrap items-center gap-2">
                <input type="hidden" name="itemId" value={it.id} />
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">{it.name}</span>
                <select name="status" defaultValue={it.status} className={`text-xs ${inp}`}>
                  {ITEM_STATUSES.map((s) => <option key={s} value={s}>{s.replaceAll('_', ' ').toLowerCase()}</option>)}
                </select>
                <button className="border border-gold/40 px-2 py-1 text-[11px] uppercase tracking-wider text-gold-light hover:bg-surface-elevated">OK</button>
              </form>
              {/* Certificado de autenticidad */}
              {it.certificate ? (
                <span className="serial w-full text-[11px] text-silver">
                  ✦ Certificado {it.certificate.serial}
                  {it.certificate.nominalName ? ` · ${it.certificate.nominalName}` : ''} · QR {it.certificate.qrCode.slice(0, 10)}…
                </span>
              ) : (
                <form action={issueCertificateAction} className="w-full">
                  <input type="hidden" name="itemId" value={it.id} />
                  <button className="text-[11px] text-gold-light hover:underline">Emitir certificado</button>
                </form>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Envíos */}
      <section className="mt-4 rounded-card border border-border bg-surface p-5">
        <h2 className="font-display text-lg text-gold-light">Envíos</h2>
        {o.shipments.length > 0 ? (
          <ul className="mt-2 space-y-1 text-sm text-silver">
            {o.shipments.map((s) => (
              <li key={s.id}>{s.carrier ?? 'Envío'} {s.trackingCode ? `· ${s.trackingCode}` : ''} ({s.status.toLowerCase()}) · {s.shippedAt ? fmtDate(s.shippedAt) : '—'}</li>
            ))}
          </ul>
        ) : <p className="mt-2 text-sm text-muted">Sin envíos.</p>}
        <form action={createShipmentAction} className="mt-3 flex flex-wrap items-end gap-2 border-t border-border pt-3">
          <input type="hidden" name="orderId" value={o.id} />
          <input name="carrier" placeholder="Transportista" className={`text-xs ${inp}`} />
          <input name="tracking" placeholder="Tracking" className={`text-xs ${inp}`} />
          <button className="bevel bg-gold px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1a1408]">Marcar enviado</button>
        </form>
      </section>
    </div>
  );
}
