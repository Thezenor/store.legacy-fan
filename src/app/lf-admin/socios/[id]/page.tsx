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
  addManualPaymentAction,
  deletePaymentAction,
} from '@/lib/admin-actions';
import { ConfirmButton } from '@/components/admin/confirm-button';
import {
  memberStatusLabel,
  paymentStatusLabel,
  subscriptionStatusLabel,
  orderItemStatusLabel,
  shipmentStatusLabel,
  paymentProviderLabel,
} from '@/lib/admin/labels';

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

export default async function SocioDetalle({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string; payerror?: string; paydeleted?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const m = await prisma.membership.findUnique({
    where: { id },
    include: {
      memberNumber: true,
      user: {
        include: {
          profile: true,
          subscription: true,
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

      {sp.paid ? (
        <p className="mt-3 rounded border border-green-500/40 bg-green-500/10 px-4 py-2 text-sm text-green-300">
          ✓ Pago manual registrado (ref. {sp.paid}).
        </p>
      ) : null}
      {sp.paydeleted ? (
        <p className="mt-3 rounded border border-green-500/40 bg-green-500/10 px-4 py-2 text-sm text-green-300">
          ✓ Línea de pago eliminada.
        </p>
      ) : null}
      {sp.payerror ? (
        <p className="mt-3 rounded border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          No se pudo registrar el pago: {sp.payerror === 'datos' ? 'datos inválidos' : sp.payerror === 'nouser' ? 'usuario no encontrado' : sp.payerror}
        </p>
      ) : null}

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
            <select name="status" defaultValue={m.status} className={`mt-1 ${inp}`}>{STATUSES.map((s) => <option key={s} value={s}>{memberStatusLabel(s)}</option>)}</select></label>
          <label className="block flex-1"><span className="text-xs text-muted">Observaciones (se registran con tu usuario)</span>
            <input name="observations" placeholder="Motivo del cambio…" className={`mt-1 w-full ${inp}`} /></label>
          <span className="text-xs text-muted">Alta: {fmtDate(m.startsAt)} · Fin: {fmtDate(m.endsAt)}</span>
          <button className={btn}>Guardar</button>
        </form>
      </Card>

      {/* Suscripción (renovación anual) */}
      <Card title="Suscripción">
        {u.subscription ? (
          <div className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            <div className="flex justify-between gap-2"><span className="text-muted">Estado</span><span className="text-foreground">{subscriptionStatusLabel(u.subscription.status)}</span></div>
            <div className="flex justify-between gap-2"><span className="text-muted">Club</span><span className="text-foreground">{u.subscription.club}</span></div>
            <div className="flex justify-between gap-2"><span className="text-muted">Importe/año</span><span className="text-foreground">{formatMoney(u.subscription.amountCents, u.subscription.currency, 'es')}</span></div>
            <div className="flex justify-between gap-2"><span className="text-muted">Próxima renovación</span><span className="text-foreground">{fmtDate(u.subscription.currentPeriodEnd)}</span></div>
            <div className="flex justify-between gap-2"><span className="text-muted">Cancela al vencer</span><span className="text-foreground">{u.subscription.cancelAtPeriodEnd ? 'Sí' : 'No'}</span></div>
            <div className="flex justify-between gap-2"><span className="text-muted">Pasarela</span><span className="serial text-xs">{u.subscription.provider} · {u.subscription.providerSubscriptionId ?? '—'}</span></div>
          </div>
        ) : (
          <p className="text-sm text-muted">Sin suscripción recurrente (pago único o reserva).</p>
        )}
      </Card>

      {/* Pagos */}
      <Card title={`Pagos (${u.payments.length})`}>
        {u.payments.length === 0 ? <p className="text-sm text-muted">Sin pagos.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-faint"><tr><th className="py-2">Fecha</th><th>Importe</th><th>Estado</th><th>Método</th><th>Referencia</th><th>Factura</th><th></th></tr></thead>
              <tbody>
                {u.payments.map((pay) => (
                  <tr key={pay.id} className="border-t border-border/60">
                    <td className="py-2 text-muted">{fmtDate(pay.createdAt)}</td>
                    <td className="text-foreground">{formatMoney(pay.amountCents, pay.currency, 'es')}</td>
                    <td className="text-muted">{paymentStatusLabel(pay.status)}</td>
                    <td className={pay.provider === 'MANUAL' ? 'text-gold-light' : 'text-muted'}>{paymentProviderLabel(pay.provider)}</td>
                    <td className="serial text-xs">{pay.providerRef ?? '—'}</td>
                    <td className="text-gold-light">{pay.invoice?.number ?? '—'}</td>
                    <td className="text-right">
                      <form>
                        <input type="hidden" name="paymentId" value={pay.id} />
                        <input type="hidden" name="membershipId" value={m.id} />
                        <ConfirmButton
                          action={deletePaymentAction}
                          label="Borrar"
                          confirmText={`¿Borrar esta línea de pago (${formatMoney(pay.amountCents, pay.currency, 'es')})? Se elimina también su factura si la tuviera. No revierte la activación del socio.`}
                          className="text-[11px] text-red-400 hover:underline"
                        />
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Registrar un pago MANUAL (cobro fuera de pasarela) */}
        <div className="mt-4 rounded border border-gold/30 bg-surface-elevated/40 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-gold-light">Registrar pago manual</p>
          <p className="mt-1 text-[11px] text-muted">
            Cobro a mano. «Reserva» asigna número y deja pendiente; «Pago total» activa al socio. Se guarda como
            manual, con tu usuario y el motivo.
          </p>
          <form action={addManualPaymentAction} className="mt-2 flex flex-wrap items-end gap-3">
            <input type="hidden" name="userId" value={u.id} />
            <input type="hidden" name="membershipId" value={m.id} />
            <label className="block"><span className="text-xs text-muted">Tipo</span>
              <select name="kind" className={`mt-1 ${inp}`}>
                <option value="reserve">Reserva (no activa)</option>
                <option value="full">Pago total (activa socio)</option>
              </select></label>
            <label className="block"><span className="text-xs text-muted">Club</span>
              <select name="club" defaultValue={m.club} className={`mt-1 ${inp}`}>
                <option value="PRIME">PRIME</option><option value="PRESTIGE">PRESTIGE</option>
              </select></label>
            <label className="block"><span className="text-xs text-muted">Importe</span>
              <input name="amount" type="number" step="0.01" min="0" required className={`mt-1 w-28 ${inp}`} /></label>
            <label className="block"><span className="text-xs text-muted">Divisa</span>
              <select name="currency" defaultValue={u.subscription?.currency ?? p?.preferredCurrency ?? 'EUR'} className={`mt-1 ${inp}`}>
                <option value="EUR">EUR (€)</option><option value="USD">USD ($)</option>
              </select></label>
            <label className="block flex-1 min-w-[180px]"><span className="text-xs text-muted">Motivo</span>
              <input name="reason" placeholder="Motivo del cobro manual…" className={`mt-1 w-full ${inp}`} /></label>
            <button className="bevel bg-gold px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#1a1408]">Registrar</button>
          </form>
        </div>
      </Card>

      {/* Reservas */}
      <Card title={`Reservas (${u.reservations.length})`}>
        {u.reservations.length === 0 ? <p className="text-sm text-muted">Sin reservas.</p> : (
          <ul className="space-y-1 text-sm">
            {u.reservations.map((r) => (
              <li key={r.id} className="flex flex-wrap justify-between gap-2 border-b border-border/60 pb-1">
                <span className="text-muted">{fmtDate(r.createdAt)} · {r.type} · {r.club ?? '—'}</span>
                <span className="text-foreground">{paymentStatusLabel(r.status)} · pagado {formatMoney(r.amountPaidCents, r.currency, 'es')}</span>
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
                <li key={it.id} className="flex justify-between gap-3"><span className="min-w-0 truncate text-foreground">{it.name}</span><span className="shrink-0 text-xs text-muted">{orderItemStatusLabel(it.status)}</span></li>
              ))}
            </ul>
            {o.shipments.map((s) => (
              <p key={s.id} className="mt-1 text-xs text-silver">Envío {s.carrier ?? ''} {s.trackingCode ? `· ${s.trackingCode}` : ''} ({shipmentStatusLabel(s.status)})</p>
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
