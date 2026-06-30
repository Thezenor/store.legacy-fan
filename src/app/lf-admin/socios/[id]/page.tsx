import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatMoney } from '@/lib/commerce/money';
import {
  updateMembershipAction,
  adjustPointsAction,
  resetUserPasswordAction,
} from '@/lib/admin-actions';

const STATUSES = [
  'CUENTA_CREADA', 'RESERVA_PENDIENTE', 'SOCIO_ACTIVO', 'SOCIO_CADUCADO',
  'SOCIO_SUSPENDIDO', 'UPGRADE_PENDIENTE', 'UPGRADE_COMPLETADO',
];

const inp = 'rounded border border-border bg-background px-2 py-1.5 text-foreground';
const btn = 'border border-gold/40 px-3 py-1.5 text-xs uppercase tracking-wider text-gold-light hover:bg-surface-elevated';

export default async function SocioDetalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = await prisma.membership.findUnique({
    where: { id },
    include: {
      memberNumber: true,
      user: { include: { profile: true, pointsWallet: true, referralCode: true, payments: true, reservations: true } },
    },
  });
  if (!m) notFound();
  const u = m.user;

  return (
    <div className="max-w-2xl">
      <Link href="/lf-admin/socios" className="text-sm text-muted hover:text-foreground">← Socios</Link>
      <h1 className="mt-2 font-display text-3xl font-bold text-foreground">
        {u.profile ? `${u.profile.firstName} ${u.profile.lastName}` : u.email}
      </h1>
      <p className="mt-1 text-sm text-muted">{u.email} · <span className="serial">{m.memberNumber?.formatted ?? 's/n'}</span></p>

      <section className="mt-6 rounded-card border border-border bg-surface p-5">
        <h2 className="font-display text-lg text-gold-light">Membresía</h2>
        <form action={updateMembershipAction} className="mt-3 flex flex-wrap items-end gap-3">
          <input type="hidden" name="membershipId" value={m.id} />
          <label className="block"><span className="text-xs text-muted">Club</span>
            <select name="club" defaultValue={m.club} className={`mt-1 ${inp}`}>
              <option value="PRIME">PRIME</option><option value="PRESTIGE">PRESTIGE</option>
            </select></label>
          <label className="block"><span className="text-xs text-muted">Estado</span>
            <select name="status" defaultValue={m.status} className={`mt-1 ${inp}`}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select></label>
          <button type="submit" className={btn}>Guardar</button>
        </form>
      </section>

      <section className="mt-4 rounded-card border border-border bg-surface p-5">
        <h2 className="font-display text-lg text-gold-light">Saldo / puntos</h2>
        <p className="mt-1 text-sm text-muted">Saldo actual: <span className="serial">{formatMoney(u.pointsWallet?.balanceCents ?? 0, 'EUR', 'es')}</span></p>
        <form action={adjustPointsAction} className="mt-3 flex flex-wrap items-end gap-3">
          <input type="hidden" name="userId" value={u.id} />
          <label className="block"><span className="text-xs text-muted">Ajuste € (+/-)</span>
            <input name="amount" type="number" step="0.01" placeholder="-10.00" className={`mt-1 w-28 ${inp}`} /></label>
          <label className="block flex-1"><span className="text-xs text-muted">Motivo</span>
            <input name="reason" className={`mt-1 w-full ${inp}`} /></label>
          <button type="submit" className={btn}>Aplicar</button>
        </form>
      </section>

      <section className="mt-4 rounded-card border border-border bg-surface p-5">
        <h2 className="font-display text-lg text-gold-light">Restablecer contraseña</h2>
        <form action={resetUserPasswordAction} className="mt-3 flex flex-wrap items-end gap-3">
          <input type="hidden" name="userId" value={u.id} />
          <label className="block flex-1"><span className="text-xs text-muted">Nueva contraseña (mín. 8)</span>
            <input name="password" type="text" className={`mt-1 w-full ${inp}`} /></label>
          <button type="submit" className={btn}>Restablecer</button>
        </form>
      </section>

      <section className="mt-4 rounded-card border border-border bg-surface p-5 text-sm text-muted">
        <h2 className="font-display text-lg text-gold-light">Datos</h2>
        <p className="mt-2">Código referido: <span className="serial">{u.referralCode?.code ?? '—'}</span></p>
        <p>Pagos: {u.payments.length} · Reservas: {u.reservations.length}</p>
        <p>Verificado: {u.emailVerified ? 'sí' : 'no'} · Bloqueado: {u.isBlocked ? 'sí' : 'no'}</p>
      </section>
    </div>
  );
}
