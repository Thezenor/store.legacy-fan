import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import {
  toggleUserBlockAction,
  resetUserPasswordAction,
  deleteUserAction,
  resendRegistrationEmailAction,
  createManualUserAction,
} from '@/lib/admin-actions';
import { COUNTRIES } from '@/lib/countries';

export const dynamic = 'force-dynamic';

type Filter = 'all' | 'nonmember' | 'unverified';
const inp = 'rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground';

// Registros: TODOS los usuarios (sean o no socios) con buscador y administración.
export default async function AdminRegistros({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string }>;
}) {
  const { filter: rawFilter, q: rawQ } = await searchParams;
  const filter: Filter =
    rawFilter === 'nonmember' || rawFilter === 'unverified' ? rawFilter : 'all';
  const q = (rawQ ?? '').trim();

  const where = q
    ? {
        OR: [
          { email: { contains: q, mode: 'insensitive' as const } },
          { profile: { firstName: { contains: q, mode: 'insensitive' as const } } },
          { profile: { lastName: { contains: q, mode: 'insensitive' as const } } },
        ],
      }
    : {};

  const users = await prisma.user.findMany({
    where,
    include: {
      profile: true,
      membership: { include: { memberNumber: true } },
      reservations: { select: { status: true }, orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { createdAt: 'desc' },
    take: 300,
  });

  const isMember = (u: (typeof users)[number]) => u.membership?.status === 'SOCIO_ACTIVO';
  const filtered = users.filter((u) => {
    if (filter === 'nonmember') return !isMember(u);
    if (filter === 'unverified') return !u.emailVerified;
    return true;
  });

  const fmtDate = (d: Date) => new Date(d).toISOString().slice(0, 10);
  const statusOf = (u: (typeof users)[number]) => {
    if (u.membership?.status === 'SOCIO_ACTIVO') return { label: 'Socio activo', cls: 'text-silver' };
    const r = u.reservations[0]?.status;
    if (r === 'RESERVA_PENDIENTE') return { label: 'Reserva (depósito pagado)', cls: 'text-gold-light' };
    if (r === 'PENDIENTE_DE_PAGO') return { label: 'Pago iniciado', cls: 'text-muted' };
    return { label: 'Registrado (sin socio)', cls: 'text-faint' };
  };

  const tab = (key: Filter, label: string) => {
    const params = new URLSearchParams();
    if (key !== 'all') params.set('filter', key);
    if (q) params.set('q', q);
    const qs = params.toString();
    return (
      <Link
        href={`/lf-admin/registros${qs ? `?${qs}` : ''}`}
        className={`rounded px-3 py-1.5 text-xs ${
          filter === key ? 'bg-gold/15 text-gold-light' : 'border border-border text-muted hover:text-foreground'
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-foreground">Registros</h1>
      <p className="mt-1 text-sm text-muted">
        {filtered.length} de {users.length} usuarios{q ? ` para “${q}”` : ''}.
      </p>

      {/* Alta manual de cliente */}
      <details className="mt-4 rounded-card border border-gold/30 bg-surface p-4">
        <summary className="cursor-pointer text-sm font-semibold text-gold-light">+ Dar de alta un cliente manualmente</summary>
        <form action={createManualUserAction} className="mt-3 flex flex-wrap items-end gap-3">
          <label className="block"><span className="text-xs text-muted">Nombre</span>
            <input name="firstName" required className={`${inp} mt-1 w-36`} /></label>
          <label className="block"><span className="text-xs text-muted">Apellidos</span>
            <input name="lastName" required className={`${inp} mt-1 w-40`} /></label>
          <label className="block"><span className="text-xs text-muted">Email</span>
            <input name="email" type="email" required className={`${inp} mt-1 w-56`} /></label>
          <label className="block"><span className="text-xs text-muted">Teléfono</span>
            <input name="phone" className={`${inp} mt-1 w-32`} /></label>
          <label className="block"><span className="text-xs text-muted">País</span>
            <select name="country" defaultValue="ES" className={`${inp} mt-1`}>
              {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select></label>
          <label className="block"><span className="text-xs text-muted">Contraseña (opcional)</span>
            <input name="password" type="text" placeholder="aleatoria si vacío" className={`${inp} mt-1 w-40`} /></label>
          <label className="flex items-center gap-2 text-xs text-muted"><input type="checkbox" name="sendEmail" defaultChecked /> Enviar correo de verificación</label>
          <button className="bevel bg-gold px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#1a1408]">Dar de alta</button>
        </form>
      </details>

      {/* Buscador */}
      <form method="get" action="/lf-admin/registros" className="mt-4 flex flex-wrap items-center gap-2">
        {filter !== 'all' ? <input type="hidden" name="filter" value={filter} /> : null}
        <input name="q" defaultValue={q} placeholder="Buscar por nombre, apellidos o email…" className={`${inp} w-72`} />
        <button className="rounded border border-border px-3 py-1.5 text-xs text-muted hover:text-foreground">Buscar</button>
        {q ? <Link href={`/lf-admin/registros${filter !== 'all' ? `?filter=${filter}` : ''}`} className="text-xs text-gold hover:underline">Limpiar</Link> : null}
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {tab('all', 'Todos')}
        {tab('nonmember', 'Sin socio')}
        {tab('unverified', 'Email sin verificar')}
      </div>

      <div className="mt-4 overflow-x-auto rounded-card border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wider text-faint">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">País</th>
              <th className="px-4 py-3">Alta</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-muted">
                  No hay usuarios para este filtro/búsqueda.
                </td>
              </tr>
            ) : (
              filtered.map((u) => {
                const st = statusOf(u);
                return (
                  <tr key={u.id} className="border-t border-border align-top">
                    <td className="px-4 py-3 text-foreground">
                      {u.profile ? `${u.profile.firstName} ${u.profile.lastName}` : '—'}
                      {u.membership ? (
                        <Link
                          href={`/lf-admin/socios/${u.membership.id}`}
                          className="ml-2 text-[11px] text-gold hover:underline"
                        >
                          ficha{u.membership.memberNumber ? ` ${u.membership.memberNumber.formatted}` : ''}
                        </Link>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-muted">{u.email}</td>
                    <td className="px-4 py-3 text-muted">{u.profile?.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-muted">{u.profile?.country ?? '—'}</td>
                    <td className="px-4 py-3 text-muted">{fmtDate(u.createdAt)}</td>
                    <td className={`px-4 py-3 ${st.cls}`}>{st.label}</td>
                    <td className="px-4 py-3">
                      {u.emailVerified ? (
                        <span className="text-silver">✓</span>
                      ) : (
                        <span className="text-faint">sin verificar</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap gap-2">
                          <form action={toggleUserBlockAction}>
                            <input type="hidden" name="userId" value={u.id} />
                            <button
                              type="submit"
                              className={`rounded border px-2 py-1 text-xs ${
                                u.isBlocked
                                  ? 'border-red-500/40 text-red-400'
                                  : 'border-border text-muted hover:text-foreground'
                              }`}
                            >
                              {u.isBlocked ? 'Desbloquear' : 'Bloquear'}
                            </button>
                          </form>
                          <form action={resendRegistrationEmailAction}>
                            <input type="hidden" name="userId" value={u.id} />
                            <button type="submit" className="rounded border border-border px-2 py-1 text-xs text-muted hover:text-foreground">
                              Reenviar correo
                            </button>
                          </form>
                          <form action={deleteUserAction}>
                            <input type="hidden" name="userId" value={u.id} />
                            <button type="submit" className="rounded border border-red-500/40 px-2 py-1 text-xs text-red-400 hover:bg-red-500/10">
                              Eliminar
                            </button>
                          </form>
                        </div>
                        <form action={resetUserPasswordAction} className="flex items-center gap-1">
                          <input type="hidden" name="userId" value={u.id} />
                          <input
                            name="password"
                            type="text"
                            placeholder="Nueva contraseña"
                            className="w-32 rounded border border-border bg-background px-2 py-1 text-xs text-foreground"
                          />
                          <button type="submit" className="rounded border border-border px-2 py-1 text-xs text-muted hover:text-foreground">
                            Reset
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
