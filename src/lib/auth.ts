import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from './prisma';

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

/**
 * Configuración base de Auth.js (NextAuth v5).
 * Estrategia: credenciales (email + password) con hash bcrypt.
 * Email único garantizado a nivel de BD (User.email @unique).
 * La lógica completa de registro/verificación se implementa en Fase 1.
 */
// Secreto que firma los JWT de sesión. En producción es OBLIGATORIO (fail-fast):
// sin él, un atacante con un secreto conocido podría forjar sesiones de admin.
// En desarrollo se permite un valor efímero local (no sirve en prod).
function resolveAuthSecret(): string {
  const fromEnv = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (fromEnv) return fromEnv;
  // Durante `next build` (recolección de datos de página) no se sirven peticiones
  // ni se firman sesiones: no exigir el secreto aquí para no romper el build.
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return 'lf-build-time-placeholder-not-used-at-runtime';
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'AUTH_SECRET no está definido. Define AUTH_SECRET en el entorno (Railway) antes de arrancar.',
    );
  }
  // Solo desarrollo: valor local, nunca usado en producción.
  return 'lf-dev-only-secret-not-for-production';
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // Necesario detrás de proxies (Railway/Cloudflare) para validar el host.
  trustHost: true,
  secret: resolveAuthSecret(),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });
        if (!user || !user.passwordHash || user.isBlocked || !user.isActive) {
          return null;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          emailVerified: user.emailVerified,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.emailVerified = (user as { emailVerified?: Date | null }).emailVerified ?? null;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        if (token.uid) session.user.id = token.uid as string;
        session.user.emailVerified = (token.emailVerified as Date | null) ?? null;
      }
      return session;
    },
  },
});
