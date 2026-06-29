'use server';

import { headers } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { signIn, signOut } from './auth';
import { RL } from './rate-limit';
import { registerSchema, loginSchema, forgotSchema, resetSchema } from './validation/auth';
import { emailVerification, passwordReset } from './tokens';
import { sendVerificationEmail, sendPasswordResetEmail } from './email/auth-emails';

type Locale = 'es' | 'en' | 'fr' | 'it';

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; code: string; fieldErrors?: Record<string, string> };

async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get('x-forwarded-for');
  return fwd?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
}

function flattenZod(error: { issues: { path: (string | number)[]; message: string }[] }) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '_');
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

export async function registerAction(formData: FormData): Promise<ActionResult> {
  const locale = (formData.get('locale') as Locale) || 'es';
  const raw = {
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    phone: formData.get('phone') ?? '',
    country: formData.get('country'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
    currency: formData.get('currency') ?? 'EUR',
    acceptTerms: formData.get('acceptTerms') === 'on' || formData.get('acceptTerms') === 'true',
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, code: 'validation', fieldErrors: flattenZod(parsed.error) };
  }
  const data = parsed.data;

  const ip = await clientIp();
  if (!RL.register(ip).success || !RL.register(data.email).success) {
    return { ok: false, code: 'rate_limited' };
  }

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return { ok: false, code: 'email_taken', fieldErrors: { email: 'email_taken' } };
  }

  const passwordHash = await bcrypt.hash(data.password, 12);
  await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      profile: {
        create: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone || null,
          country: data.country.toUpperCase(),
          preferredLocale: locale,
          preferredCurrency: data.currency,
          termsAcceptedAt: new Date(),
        },
      },
    },
  });

  const token = await emailVerification.create(data.email);
  await sendVerificationEmail(data.email, locale, token);

  return { ok: true, message: 'verify_sent' };
}

export async function verifyEmailAction(email: string, token: string): Promise<ActionResult> {
  const valid = await emailVerification.consume(email, token);
  if (!valid) return { ok: false, code: 'token_invalid' };

  await prisma.user.update({
    where: { email: email.toLowerCase() },
    data: { emailVerified: new Date() },
  });
  return { ok: true, message: 'verified' };
}

export async function resendVerificationAction(email: string, locale: Locale): Promise<ActionResult> {
  if (!RL.verifyResend(email).success) return { ok: false, code: 'rate_limited' };
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  // No revelar si existe; si existe y no está verificado, reenviar.
  if (user && !user.emailVerified) {
    const token = await emailVerification.create(email);
    await sendVerificationEmail(email, locale, token);
  }
  return { ok: true, message: 'verify_sent' };
}

export async function forgotPasswordAction(formData: FormData): Promise<ActionResult> {
  const locale = (formData.get('locale') as Locale) || 'es';
  const parsed = forgotSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) return { ok: false, code: 'validation' };

  const { email } = parsed.data;
  if (!RL.forgot(await clientIp()).success || !RL.forgot(email).success) {
    return { ok: false, code: 'rate_limited' };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const token = await passwordReset.create(email);
    await sendPasswordResetEmail(email, locale, token);
  }
  // Respuesta uniforme para evitar enumeración de cuentas.
  return { ok: true, message: 'reset_sent' };
}

export async function resetPasswordAction(formData: FormData): Promise<ActionResult> {
  const parsed = resetSchema.safeParse({
    token: formData.get('token'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });
  if (!parsed.success) {
    return { ok: false, code: 'validation', fieldErrors: flattenZod(parsed.error) };
  }
  const email = String(formData.get('email') ?? '');
  const valid = await passwordReset.consume(email, parsed.data.token);
  if (!valid) return { ok: false, code: 'token_invalid' };

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await prisma.user.update({ where: { email: email.toLowerCase() }, data: { passwordHash } });
  return { ok: true, message: 'password_updated' };
}

export async function loginAction(formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) return { ok: false, code: 'invalid_credentials' };

  if (!RL.login(await clientIp()).success || !RL.login(parsed.data.email).success) {
    return { ok: false, code: 'rate_limited' };
  }

  try {
    await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    return { ok: true };
  } catch {
    return { ok: false, code: 'invalid_credentials' };
  }
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirect: false });
}
