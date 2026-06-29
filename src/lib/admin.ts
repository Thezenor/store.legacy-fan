import { redirect } from 'next/navigation';
import { auth } from './auth';
import { prisma } from './prisma';

// Acceso al superadmin (/lf-admin). RBAC por roles (doc 09) con bootstrap por
// email: SUPERADMIN_EMAILS permite el primer acceso antes de asignar roles en BD.

function superEmails(): string[] {
  return (process.env.SUPERADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export async function getAdminSession() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const email = session.user.email?.toLowerCase();
  if (email && superEmails().includes(email)) {
    return { session, roles: ['superadmin'] as string[] };
  }

  const userRoles = await prisma.userRole.findMany({
    where: { userId: session.user.id },
    include: { role: true },
  });
  const roles = userRoles.map((r) => r.role.key);
  const isAdmin = roles.some((k) => k === 'superadmin' || k === 'admin');
  return isAdmin ? { session, roles } : null;
}

/** Exige sesión de admin; si no, redirige. Uso en layout/páginas de /lf-admin. */
export async function requireAdmin() {
  const ok = await getAdminSession();
  if (!ok) redirect('/login');
  return ok;
}
