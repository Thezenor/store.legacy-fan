import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatMoney } from '@/lib/commerce/money';
import { refundPaymentAction, expireReservationAction, refundDepositAction } from '@/lib/admin-actions';
import { ConfirmButton } from '@/components/admin/confirm-button';

export const dynamic = 'force-dynamic';

export default async function AdminPagos() {
  // select ajustado: sin rawPayload (JSON de PayPal de 5-20 KB por fila).
  const [payments, reservations] = await Promise.all([
    prisma.payment.findMany({
      select: {
        id: true,
        createdAt: true,
        amountCents: true,
        currency: true,
        mode: true,
        provider: true,
        providerRef: true,
        status: true,
        user: { select: { email: true, membership: { select: { id: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    // Reservas activas o pendientes (no las ya finalizadas/caducadas).
    prisma.reservation.findMany({
      where: { status: { in: ['RESERVA_PENDIENTE', 'PENDIENTE_DE_PAGO'] } },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        createdAt: true,
        type: true,
        club: true,
        status: true,
        currency: true,
        amountPaidCents: true,
        totalDueCents: true,
        expiresAt: true,
        user: { select: { email: true, membership: { select: { id: true } } } },
      },
    }),
  ]);

  const fmtDate = (d: Date | null) =>
    d ? new Intl.DateTimeFormat('es', { dateStyle: 'short' }).format(d) : '—';

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-foreground">Reservas y pagos</h1>

      {/* Reservas activas / pendientes con acciones de ciclo de vida */}
      <h2 className="mt-6 font-display text-xl text-gold-light">Reservas activas ({reservations.length})</h2>
      <div className="mt-2 overflow-x-auto rounded-card border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wider text-faint">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Socio</th>
              <th className="px-4 py-3">Club</th>
              <th className="px-4 py-3">Pagado / total</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Caduca</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {reservations.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-muted">No hay reservas activas.</td></tr>
            ) : (
              reservations.map((r) => (
                <tr key={r.id} className="border-t border-border align-top">
                  <td className="px-4 py-3 text-muted">{fmtDate(r.createdAt)}</td>
                  <td className="px-4 py-3">
                    {r.user.membership ? (
                      <Link href={`/lf-admin/socios/${r.user.membership.id}`} className="text-gold-light hover:underline">{r.user.email}</Link>
                    ) : (
                      <span className="text-foreground">{r.user.email}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">{r.club ?? '—'}</td>
                  <td className="px-4 py-3 text-foreground">
                    {formatMoney(r.amountPaidCents, r.currency, 'es')}
                    <span className="text-faint"> / {formatMoney(r.totalDueCents, r.currency, 'es')}</span>
                  </td>
                  <td className="px-4 py-3 text-muted">{r.status.replaceAll('_', ' ').toLowerCase()}</td>
                  <td className="px-4 py-3 text-muted">{fmtDate(r.expiresAt)}</td>
                  <td className="px-4 py-3">
                    <form className="flex flex-wrap gap-3">
                      <input type="hidden" name="reservationId" value={r.id} />
                      <ConfirmButton
                        action={expireReservationAction}
                        label="Caducar"
                        confirmText="¿Caducar esta reserva? El socio quedará libre para reintentar."
                        className="text-xs text-red-400 hover:underline"
                      />
                      {r.amountPaidCents > 0 ? (
                        <ConfirmButton
                          action={refundDepositAction}
                          label="Reembolsar depósito"
                          confirmText="¿Marcar el depósito como reembolsado? (la devolución real en PayPal es aparte)"
                          className="text-xs text-red-400 hover:underline"
                        />
                      ) : null}
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 font-display text-xl text-gold-light">Pagos</h2>
      <p className="mt-1 text-sm text-muted">{payments.length} transacciones recientes</p>
      <div className="mt-6 overflow-x-auto rounded-card border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wider text-faint">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">ID pago (PayPal)</th>
              <th className="px-4 py-3">Pasarela</th>
              <th className="px-4 py-3">Importe</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-muted">
                  Aún no hay transacciones.
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-3 text-muted">
                    {new Intl.DateTimeFormat('es', { dateStyle: 'short', timeStyle: 'short' }).format(p.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    {p.user.membership ? (
                      <Link href={`/lf-admin/socios/${p.user.membership.id}`} className="text-gold-light hover:underline">{p.user.email}</Link>
                    ) : (
                      <span className="text-foreground">{p.user.email}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 serial text-xs">{p.providerRef ?? '—'}</td>
                  <td className="px-4 py-3">
                    {p.provider} <span className="text-xs text-faint">({p.mode})</span>
                  </td>
                  <td className="px-4 py-3 text-gold-light">{formatMoney(p.amountCents, p.currency, 'es')}</td>
                  <td className="px-4 py-3 text-muted">{p.status.replaceAll('_', ' ').toLowerCase()}</td>
                  <td className="px-4 py-3">
                    {p.status === 'PAGO_COMPLETO' ? (
                      <form action={refundPaymentAction}>
                        <input type="hidden" name="paymentId" value={p.id} />
                        <button type="submit" className="text-xs text-red-400 hover:underline">Reembolsar</button>
                      </form>
                    ) : null}
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
