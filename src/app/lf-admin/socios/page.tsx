import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { toggleUserBlockAction } from '@/lib/admin-actions';
import { ManualMemberForm } from '@/components/admin/manual-member-form';

export default async function AdminSocios() {
  const memberships = await prisma.membership.findMany({
    include: { user: { include: { profile: true } }, memberNumber: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-foreground">Socios</h1>
      <p className="mt-1 text-sm text-muted">{memberships.length} socios</p>

      {/* Crear socio manualmente (doc 04) */}
      <ManualMemberForm />
      <div className="mt-6 overflow-x-auto rounded-card border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wider text-faint">
            <tr>
              <th className="px-4 py-3">Nº socio</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Club</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {memberships.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted">
                  Aún no hay socios.
                </td>
              </tr>
            ) : (
              memberships.map((m) => (
                <tr key={m.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <Link href={`/lf-admin/socios/${m.id}`} className="text-gold-light hover:underline">
                      {m.memberNumber?.formatted ?? 'ver'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {m.user.profile ? `${m.user.profile.firstName} ${m.user.profile.lastName}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted">{m.user.email}</td>
                  <td className="px-4 py-3">{m.club}</td>
                  <td className="px-4 py-3 text-muted">{m.status.replaceAll('_', ' ').toLowerCase()}</td>
                  <td className="px-4 py-3">
                    <form action={toggleUserBlockAction}>
                      <input type="hidden" name="userId" value={m.user.id} />
                      <button
                        type="submit"
                        className={`rounded border px-2 py-1 text-xs ${
                          m.user.isBlocked
                            ? 'border-red-500/40 text-red-400'
                            : 'border-border text-muted hover:text-foreground'
                        }`}
                      >
                        {m.user.isBlocked ? 'Desbloquear' : 'Bloquear'}
                      </button>
                    </form>
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
