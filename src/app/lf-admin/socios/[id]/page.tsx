import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatMoney } from '@/lib/commerce/money';
import {
  updateMembershipAction,
  adjustPointsAction,
  resetUserPasswordAction,
  toggleUserBlockAction,
  updateProfileAction,
} from '@/lib/admin-actions';

const STATUSES = [
  'CUENTA_CREADA', 'RESERVA_PENDIENTE', 'SOCIO_ACTIVO', 'SOCIO_CADUCADO',
  'SOCIO_SUSPENDIDO', 'UPGRADE_PENDIENTE', 'UPGRADE_COMPLETADO',
];
const inp = 'rounded border border-border bg-background px-2 py-1.5 text-foreground';
const btn = 'border border-gold/40 px-3 py-1.5 text-xs uppercase tracking-wider text-gold-light hover:bg-surface-elevated';
const fmtDate = (d: Date | null) => (d ? new Intl.DateTimeFormat('es', { dateStyle: 'short', timeStyle: 'short' }).format(d) : '—');

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-4 rounded-card border border-border bg-surface p-5">
      <h2 className="font-display text-lg text-gold-light">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default async function SocioDetalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = await prisma.membership.findUnique({
    where: { id },
    include: {
      memberNumber: true,
      user: {
        include: {
          profile: true,
          pointsWallet: { include: { transactions: { orderBy: { createdAt: 'desc' }, take: 20 } } },
          referralCode: true,
          referralsMade: true,
          reservations: { orderBy: { createdAt: 'desc' } },
          payments: { include: { invoice: true }, orderBy: { createdAt: 'desc' } },
          orders: { include: { items: true, shipments: { include: { items: true } } }, orderBy: { createdAt: 'desc' } },
        },
      },
    },
  });
  if (!m) notFound();
  const u = m.user;
  const p = u.profile;

  return (
    <div className="max-w-3xl">
      <Link href="/lf-admin/socios" className="text-sm text-muted hover:text-foreground">← Socios</Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            {p ? `${p.firstName} ${p.lastName}` : u.email}
          </h1>
          <p className="mt-1 text-sm text-muted">{u.email} · <span className="serial">{m.memberNumber?.formatted ?? 's/n'}</span></p>
        </div>
        <form action={toggleUserBlockAction}>
          <input type="hidden" name="userId" value={u.id} />
          <button className={u.isBlocked ? 'border border-red-500/40 px-3 py-1.5 text-xs uppercase text-red-400' : btn}>
            {u.isBlocked ? 'Desbloquear' : 'Bloquear'}
          </button>
        </form>
      </div>

      {/* Datos personales / envío (editables) */}
      <Card title="Datos del cliente">
        <form action={updateProfileAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input type="hidden" name="userId" value={u.id} />
          <label className="block"><span className="text-xs text-muted">Nombre</span><input name="firstName" defaultValue={p?.firstName ?? ''} className={`mt-1 w-full ${inp}`} /></label>
          <label className="block"><span className="text-xs text-muted">Apellidos</span><input name="lastName" defaultValue={p?.lastName ?? ''} className={`mt-1 w-full ${inp}`} /></label>
          <label className="block"><span className="text-xs text-muted">Teléfono</span><input name="phone" defaultValue={p?.phone ?? ''} className={`mt-1 w-full ${inp}`} /></label>
          <label className="block"><span className="text-xs text-muted">País (ISO)</span><input name="country" defaultValue={p?.country ?? ''} className={`mt-1 w-full ${inp}`} /></label>
          <label className="block"><span className="text-xs text-muted">Dirección</span><input name="addressLine1" defaultValue={p?.addressLine1 ?? ''} className={`mt-1 w-full ${inp}`} /></label>
          <label className="block"><span className="text-xs text-muted">Dirección 2</span><input name="addressLine2" defaultValue={p?.addressLine2 ?? ''} className={`mt-1 w-full ${inp}`} /></label>
          <label className="block"><span className="text-xs text-muted">Ciudad</span><input name="city" defaultValue={p?.city ?? ''} className={`mt-1 w-full ${inp}`} /></label>
          <label className="block"><span className="text-xs text-muted">Código postal</span><input name="postalCode" defaultValue={p?.postalCode ?? ''} className={`mt-1 w-full ${inp}`} /></label>
          <div className="sm:col-span-2 flex items-center justify-between">
            <span className="text-xs text-faint">Verificado: {u.emailVerified ? 'Sí' : 'No'} · Idioma/divisa: {p?.preferredLocale ?? '—'}/{p?.preferredCurrency ?? '—'}</span>
            <button className={btn}>Guardar datos</button>
          </div>
        </form>
      </Card>

      {/* Membresía (editable) */}
      <Card title="Membresía">
        <form action={updateMembershipAction} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="membershipId" value={m.id} />
          <label className="block"><span className="text-xs text-muted">Club</span>
            <select name="club" defaultValue={m.club} className={`mt-1 ${inp}`}><option value="PRIME">PRIME</option><option value="PRESTIGE">PRESTIGE</option></select></label>
          <label className="block"><span className="text-xs text-muted">Estado</span>
            <select name="status" defaultValue={m.status} className={`mt-1 ${inp}`}>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
          <label className="block flex-1"><span className="text-xs text-muted">Observaciones (se registran con tu usuario)</span>
            <input name="observations" placeholder="Motivo del cambio…" className={`mt-1 w-full ${inp}`} /></label>
          <span className="text-xs text-muted">Alta: {fmtDate(m.startsAt)} · Fin: {fmtDate(m.endsAt)}</span>
          <button className={btn}>Guardar</button>
        </form>
      </Card>

      {/* Pagos (con ID PayPal) */}
      <Card title={`Pagos (${u.payments.length})`}>
        {u.payments.length === 0 ? <p className="text-sm text-muted">Sin pagos.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-faint"><tr><th className="py-2">Fecha</th><th>Importe</th><th>Estado</th><th>ID PayPal</th><th>Factura</th></tr></thead>
              <tbody>
                {u.payments.map((pay) => (
                  <tr key={pay.id} className="border-t border-border/60">
                    <td className="py-2 text-muted">{fmtDate(pay.createdAt)}</td>
                    <td className="text-foreground">{formatMoney(pay.amountCents, pay.currency, 'es')}</td>
                    <td className="text-muted">{pay.status.replaceAll('_', ' ').toLowerCase()}</td>
                    <td className="serial text-xs">{pay.providerRef ?? '—'}</td>
                    <td className="text-gold-light">{pay.invoice?.number ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Reservas */}
      <Card title={`Reservas (${u.reservations.length})`}>
        {u.reservations.length === 0 ? <p className="text-sm text-muted">Sin reservas.</p> : (
          <ul className="space-y-1 text-sm">
            {u.reservations.map((r) => (
              <li key={r.id} className="flex flex-wrap justify-between gap-2 border-b border-border/60 pb-1">
                <span className="text-muted">{fmtDate(r.createdAt)} · {r.type} · {r.club ?? '—'}</span>
                <span className="text-foreground">{r.status.replaceAll('_', ' ').toLowerCase()} · pagado {formatMoney(r.amountPaidCents, r.currency, 'es')}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Pedidos y envíos */}
      <Card title={`Pedidos y envíos (${u.orders.length})`}>
        {u.orders.length === 0 ? <p className="text-sm text-muted">Sin pedidos.</p> : u.orders.map((o) => (
          <div key={o.id} className="mb-3 border-b border-border/60 pb-3 last:mb-0 last:border-0">
            <p className="text-xs text-faint">Pedido <span className="serial">#{o.id.slice(-8)}</span> · {fmtDate(o.createdAt)}</p>
            <ul className="mt-1 space-y-0.5 text-sm">
              {o.items.map((it) => (
                <li key={it.id} className="flex justify-between gap-3"><span className="min-w-0 truncate text-foreground">{it.name}</span><span className="shrink-0 text-xs text-muted">{it.status.replaceAll('_', ' ').toLowerCase()}</span></li>
              ))}
            </ul>
            {o.shipments.map((s) => (
              <p key={s.id} className="mt-1 text-xs text-silver">Envío {s.carrier ?? ''} {s.trackingCode ? `· ${s.trackingCode}` : ''} ({s.status.toLowerCase()})</p>
            ))}
          </div>
        ))}
      </Card>

      {/* Puntos / saldo */}
      <Card title={`Saldo: ${formatMoney(u.pointsWallet?.balanceCents ?? 0, 'EUR', 'es')}`}>
        <form action={adjustPointsAction} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="userId" value={u.id} />
          <label className="block"><span className="text-xs text-muted">Ajuste € (+/-)</span><input name="amount" type="number" step="0.01" className={`mt-1 w-28 ${inp}`} /></label>
          <label className="block flex-1"><span className="text-xs text-muted">Motivo</span><input name="reason" className={`mt-1 w-full ${inp}`} /></label>
          <button className={btn}>Aplicar</button>
        </form>
        {u.pointsWallet && u.pointsWallet.transactions.length > 0 ? (
          <ul className="mt-3 space-y-1 text-xs text-muted">
            {u.pointsWallet.transactions.map((tx) => (
              <li key={tx.id} className="flex justify-between gap-3"><span className="min-w-0 truncate">{fmtDate(tx.createdAt)} · {tx.reason ?? tx.type}</span><span className={tx.amountCents >= 0 ? 'text-state-green' : 'text-red-400'}>{formatMoney(tx.amountCents, 'EUR', 'es')}</span></li>
            ))}
          </ul>
        ) : null}
      </Card>

      {/* Referidos + contraseña */}
      <Card title="Referidos y acceso">
        <p className="text-sm text-muted">Código de referido: <span className="serial">{u.referralCode?.code ?? '—'}</span> · Referidos hechos: {u.referralsMade.length}</p>
        <form action={resetUserPasswordAction} className="mt-3 flex flex-wrap items-end gap-3">
          <input type="hidden" name="userId" value={u.id} />
          <label className="block flex-1"><span className="text-xs text-muted">Nueva contraseña (mín. 8)</span><input name="password" type="text" className={`mt-1 w-full ${inp}`} /></label>
          <button className={btn}>Restablecer contraseña</button>
        </form>
      </Card>
    </div>
  );
}
