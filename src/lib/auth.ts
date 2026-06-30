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
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // Necesario detrás de proxies (Railway/Cloudflare) para validar el host.
  trustHost: true,
  // Secreto: usa AUTH_SECRET del entorno; si no está, un respaldo para no romper.
  // ⚠️ DEFINE AUTH_SECRET en producción (Railway) — el respaldo es público (está en el repo).
  secret:
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    'lf-fallback-43c255ce7387a70d0ceeb9bf54dcaea905598775cd97914ac3e6c1e283c0c88e',
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
