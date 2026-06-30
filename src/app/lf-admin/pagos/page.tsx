import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatMoney } from '@/lib/commerce/money';
import { refundPaymentAction } from '@/lib/admin-actions';

export default async function AdminPagos() {
  const payments = await prisma.payment.findMany({
    include: { user: { include: { membership: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-foreground">Reservas y pagos</h1>
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
