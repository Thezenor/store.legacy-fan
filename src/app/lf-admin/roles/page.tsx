import { prisma } from '@/lib/prisma';
import { assignRoleAction, removeRoleAction, createUserWithRoleAction } from '@/lib/admin-actions';

const inp = 'rounded border border-border bg-background px-2 py-1.5 text-foreground';

const ERRORS: Record<string, string> = {
  email: 'Introduce un email válido.',
  rol: 'El rol seleccionado no existe.',
  pass: 'La contraseña debe tener al menos 8 caracteres (usuario nuevo).',
};

export default async function AdminRoles({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const [roles, assignments] = await Promise.all([
    prisma.role.findMany({ orderBy: { key: 'asc' } }),
    prisma.userRole.findMany({ include: { user: true, role: true }, orderBy: { roleId: 'asc' } }),
  ]);

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl font-bold text-foreground">Roles y permisos</h1>
      <p className="mt-1 text-sm text-muted">Roles disponibles: {roles.map((r) => r.key).join(' · ')}</p>

      {sp.created ? (
        <p className="mt-4 rounded border border-green-500/40 bg-green-500/10 px-4 py-2 text-sm text-green-300">
          Usuario dado de alta y rol asignado correctamente.
        </p>
      ) : null}
      {sp.error ? (
        <p className="mt-4 rounded border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {ERRORS[sp.error] ?? 'No se pudo completar la operación.'}
        </p>
      ) : null}

      {/* Alta directa: email + contraseña + rol */}
      <div className="mt-4 rounded-card border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gold-light">Dar de alta un usuario con rol</h2>
        <p className="mt-1 text-xs text-muted">
          Crea la cuenta (verificada) y le asigna el rol en un paso. Si el email ya existe, solo se le asigna el rol;
          indica contraseña únicamente para restablecerla.
        </p>
        <form action={createUserWithRoleAction} className="mt-3 flex flex-wrap items-end gap-3">
          <label className="block flex-1 min-w-[200px]"><span className="text-xs text-muted">Email</span>
            <input name="email" type="email" required className={`mt-1 w-full ${inp}`} /></label>
          <label className="block"><span className="text-xs text-muted">Contraseña</span>
            <input name="password" type="text" minLength={8} autoComplete="new-password" className={`mt-1 ${inp}`} /></label>
          <label className="block"><span className="text-xs text-muted">Rol</span>
            <select name="roleKey" className={`mt-1 ${inp}`}>
              {roles.map((r) => <option key={r.id} value={r.key}>{r.name}</option>)}
            </select></label>
          <button type="submit" className="bevel bg-gold px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#1a1408]">Crear y asignar</button>
        </form>
      </div>

      {/* Asignar */}
      <form action={assignRoleAction} className="mt-4 flex flex-wrap items-end gap-3 rounded-card border border-border bg-surface p-4">
        <label className="block flex-1"><span className="text-xs text-muted">Email del usuario</span>
          <input name="email" type="email" required className={`mt-1 w-full ${inp}`} /></label>
        <label className="block"><span className="text-xs text-muted">Rol</span>
          <select name="roleKey" className={`mt-1 ${inp}`}>
            {roles.map((r) => <option key={r.id} value={r.key}>{r.name}</option>)}
          </select></label>
        <button type="submit" className="bevel bg-gold px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#1a1408]">Asignar</button>
      </form>

      {/* Asignaciones actuales */}
      <div className="mt-6 overflow-x-auto rounded-card border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wider text-faint">
            <tr><th className="px-4 py-3">Usuario</th><th className="px-4 py-3">Rol</th><th className="px-4 py-3"></th></tr>
          </thead>
          <tbody>
            {assignments.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-muted">Sin asignaciones (el acceso usa SUPERADMIN_EMAILS).</td></tr>
            ) : assignments.map((a) => (
              <tr key={`${a.userId}-${a.roleId}`} className="border-t border-border">
                <td className="px-4 py-3 text-foreground">{a.user.email}</td>
                <td className="px-4 py-3 text-gold-light">{a.role.name}</td>
                <td className="px-4 py-3">
                  <form action={removeRoleAction}>
                    <input type="hidden" name="userId" value={a.userId} />
                    <input type="hidden" name="roleId" value={a.roleId} />
                    <button type="submit" className="text-xs text-red-400 hover:underline">Quitar</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
