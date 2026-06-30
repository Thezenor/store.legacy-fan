import { prisma } from '@/lib/prisma';
import { toggleMemberNumberBlockAction } from '@/lib/admin-actions';
import { ManualMemberForm } from '@/components/admin/manual-member-form';

export default async function AdminNumeracion() {
  const numbers = await prisma.memberNumber.findMany({
    orderBy: { number: 'asc' },
    include: { membership: { include: { user: true } } },
  });
  const reserved = numbers.filter((n) => n.isReserved);
  const assigned = numbers.filter((n) => n.membershipId);

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl font-bold text-foreground">Numeración de socios</h1>
      <p className="mt-1 text-sm text-muted">
        1–100 reservados a asignación manual · automática desde LF-000101. {assigned.length} asignados.
      </p>

      {/* Alta manual de socio reservado (rellena los datos a mano) */}
      <h2 className="mt-6 font-display text-lg text-gold-light">Alta manual de socio</h2>
      <p className="mt-1 text-xs text-muted">Asigna un número reservado (1–100) a un usuario ya registrado.</p>
      <ManualMemberForm />

      <h2 className="mt-8 font-display text-lg text-gold-light">Reservados (1–100)</h2>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {reserved.map((n) => (
          <form key={n.id} action={toggleMemberNumberBlockAction} className="flex items-center justify-between rounded border border-border bg-surface px-2 py-1.5 text-xs">
            <input type="hidden" name="id" value={n.id} />
            <span className={n.membershipId ? 'text-gold-light' : n.isBlocked ? 'text-red-400 line-through' : 'serial'}>
              {n.formatted}
            </span>
            {n.membershipId ? (
              <span className="text-[10px] text-faint">asignado</span>
            ) : (
              <button type="submit" className="text-[10px] uppercase tracking-wider text-muted hover:text-foreground">
                {n.isBlocked ? 'activar' : 'bloquear'}
              </button>
            )}
          </form>
        ))}
      </div>

      <h2 className="mt-8 font-display text-lg text-gold-light">Asignados</h2>
      <div className="mt-2 overflow-x-auto rounded-card border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wider text-faint">
            <tr><th className="px-4 py-3">Número</th><th className="px-4 py-3">Socio</th><th className="px-4 py-3">Club</th></tr>
          </thead>
          <tbody>
            {assigned.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-muted">Aún no hay números asignados.</td></tr>
            ) : assigned.map((n) => (
              <tr key={n.id} className="border-t border-border">
                <td className="px-4 py-3 text-gold-light">{n.formatted}</td>
                <td className="px-4 py-3 text-foreground">{n.membership?.user.email ?? '—'}</td>
                <td className="px-4 py-3 text-muted">{n.membership?.club ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
