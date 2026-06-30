'use server';

type ClubType = string;
import { headers } from 'next/headers';
import bcrypt from 'bcryptjs';
import { AuthError } from 'next-auth';
import { auth, signIn } from '../auth';
import { prisma } from '../prisma';
import { RL } from '../rate-limit';
import { getDisplayCurrency } from '../commerce/currency';
import { getPlan } from '../commerce';
import { getSetting } from '../commerce/settings';
import { startSubscription } from '../subscriptions';
import { checkoutRegisterSchema, loginSchema } from '../validation/auth';
import { emailVerification } from '../tokens';
import { sendVerificationEmail } from '../email/auth-emails';
import { startReservation, hasActiveReservationOrMembership } from './reservation';
import { startFullPayment } from './full-payment';

export type StartReservationActionResult =
  | { ok: true; approveUrl: string }
  | { ok: false; code: 'unauthenticated' | 'unverified' | 'already_active' | 'error' };

/**
 * Inicia la reserva (50 €/$) y devuelve la URL de aprobación de PayPal.
 * Gating D-009: requiere usuario con email verificado.
 */
export async function startReservationAction(
  club: ClubType | null,
  locale: string,
): Promise<StartReservationActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, code: 'unauthenticated' };
  if (!session.user.emailVerified) return { ok: false, code: 'unverified' };

  if (await hasActiveReservationOrMembership(session.user.id)) {
    return { ok: false, code: 'already_active' };
  }

  try {
    const currency = await getDisplayCurrency();
    const { approveUrl } = await startReservation({
      userId: session.user.id,
      club,
      currency,
      locale,
    });
    return { ok: true, approveUrl };
  } catch {
    return { ok: false, code: 'error' };
  }
}

export type FullPaymentActionResult =
  | { ok: true; approveUrl: string }
  | { ok: false; code: 'unauthenticated' | 'unverified' | 'already_member' | 'error' };

/**
 * Inicia el pago completo de un club (descuenta la reserva si existe) y devuelve
 * la URL de aprobación de PayPal. Gating D-009.
 */
export async function startFullPaymentAction(
  club: ClubType,
  locale: string,
): Promise<FullPaymentActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, code: 'unauthenticated' };
  if (!session.user.emailVerified) return { ok: false, code: 'unverified' };

  try {
    const currency = await getDisplayCurrency();
    const { approveUrl } = await startFullPayment({
      userId: session.user.id,
      club,
      currency,
      locale,
    });
    return { ok: true, approveUrl };
  } catch (e) {
    if (e instanceof Error && e.message === 'already_member') {
      return { ok: false, code: 'already_member' };
    }
    return { ok: false, code: 'error' };
  }
}

type Locale = 'es' | 'en' | 'fr' | 'it';

/**
 * Comprueba en tiempo real si un correo ya existe en el sistema (para que el
 * checkout pida solo la contraseña). Producto: la UX prima sobre la no-enumeración.
 */
export async function checkEmailExistsAction(email: string): Promise<boolean> {
  const e = String(email ?? '').trim().toLowerCase();
  if (!e || e.length > 200 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return false;
  const user = await prisma.user.findUnique({ where: { email: e }, select: { id: true } });
  return !!user;
}

export type CheckoutSubmitResult =
  | { ok: true; approveUrl: string }
  | { ok: false; code: string; fieldErrors?: Record<string, string> };

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
}

function flattenZod(error: { issues: { path: (string | number)[]; message: string }[] }) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '_');
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

/**
 * Flujo de compra unificado (doc usuario): el visitante elige reserva o pago
 * completo y, si no tiene sesión, se registra (datos básicos) o inicia sesión en
 * el mismo paso. Tras crear/validar la cuenta se inicia el pago y se devuelve la
 * URL de PayPal. La verificación de email no bloquea la compra (se envía aparte).
 */
export async function checkoutSubmitAction(formData: FormData): Promise<CheckoutSubmitResult> {
  const club = String(formData.get('club') ?? '').trim();
  const type = formData.get('type') === 'full' ? 'full' : 'reserve';
  const mode = formData.get('mode') === 'login' ? 'login' : 'register';
  const locale = (String(formData.get('locale') ?? 'es') as Locale) || 'es';

  // Club válido y activo.
  const plan = await getPlan(club);
  if (!plan || !plan.active) return { ok: false, code: 'error' };

  const currency = await getDisplayCurrency();

  // 1) Resolver el usuario: sesión existente, login o registro.
  let userId: string | null = null;
  const session = await auth();
  if (session?.user?.id) {
    userId = session.user.id;
  } else if (mode === 'login') {
    const parsed = loginSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
    });
    if (!parsed.success) return { ok: false, code: 'invalid_credentials' };
    if (!RL.login(await clientIp()).success || !RL.login(parsed.data.email).success) {
      return { ok: false, code: 'rate_limited' };
    }
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user || !user.passwordHash || user.isBlocked || !user.isActive) {
      return { ok: false, code: 'invalid_credentials' };
    }
    if (!(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
      return { ok: false, code: 'invalid_credentials' };
    }
    userId = user.id;
    await signInSilently(parsed.data.email, parsed.data.password);
  } else {
    const parsed = checkoutRegisterSchema.safeParse({
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      phone: formData.get('phone') ?? '',
      country: formData.get('country'),
      email: formData.get('email'),
      password: formData.get('password'),
      acceptTerms: formData.get('acceptTerms') === 'on' || formData.get('acceptTerms') === 'true',
    });
    if (!parsed.success) {
      return { ok: false, code: 'validation', fieldErrors: flattenZod(parsed.error) };
    }
    const data = parsed.data;
    if (!RL.register(await clientIp()).success || !RL.register(data.email).success) {
      return { ok: false, code: 'rate_limited' };
    }
    if (await prisma.user.findUnique({ where: { email: data.email } })) {
      return { ok: false, code: 'email_taken', fieldErrors: { email: 'email_taken' } };
    }
    const passwordHash = await bcrypt.hash(data.password, 12);
    const created = await prisma.user.create({
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
            preferredCurrency: currency,
            termsAcceptedAt: new Date(),
          },
        },
      },
    });
    userId = created.id;

    // Referido (doc 06) si llegó con código válido.
    const ref = String(formData.get('ref') ?? '').trim();
    if (ref) {
      const code = await prisma.referralCode.findUnique({ where: { code: ref } });
      if (code && code.userId !== created.id) {
        await prisma.referral.create({
          data: {
            referralCodeId: code.id,
            referrerId: code.userId,
            referredUserId: created.id,
            status: 'REGISTRADO',
          },
        });
      }
    }

    // Verificación de email en segundo plano (no bloquea la compra).
    try {
      const token = await emailVerification.create(data.email);
      await sendVerificationEmail(data.email, locale, token);
    } catch {
      /* el email de verificación no debe impedir el pago */
    }
    await signInSilently(data.email, data.password);
  }

  if (!userId) return { ok: false, code: 'unauthenticated' };

  // 2) Iniciar el pago elegido.
  try {
    if (type === 'reserve') {
      if (await hasActiveReservationOrMembership(userId)) {
        return { ok: false, code: 'already_active' };
      }
      const { approveUrl } = await startReservation({ userId, club, currency, locale });
      return { ok: true, approveUrl };
    }
    // Pago completo: suscripción recurrente o pago único según billing.mode.
    const billingMode = await getSetting<string>('billing.mode');
    if (billingMode === 'subscription') {
      const { approveUrl } = await startSubscription({ userId, club, currency, locale });
      return { ok: true, approveUrl };
    }
    const { approveUrl } = await startFullPayment({ userId, club, currency, locale });
    return { ok: true, approveUrl };
  } catch (e) {
    if (e instanceof Error && e.message === 'already_member') {
      return { ok: false, code: 'already_member' };
    }
    // Pasarela no configurada/activada o sin credenciales/plan: mensaje claro.
    if (e instanceof Error) {
      const m = e.message;
      if (
        m === 'gateway_disabled' ||
        m.includes('no está habilitada') ||
        m.includes('sin credenciales') ||
        m.startsWith('Sin plan')
      ) {
        return { ok: false, code: 'gateway_unconfigured' };
      }
    }
    return { ok: false, code: 'error' };
  }
}

/**
 * Crea la sesión sin redirigir (la redirección la hace el cliente hacia PayPal).
 * Las credenciales ya se validaron antes, por eso ignoramos un AuthError aquí.
 */
async function signInSilently(email: string, password: string): Promise<void> {
  try {
    await signIn('credentials', { email, password, redirect: false });
  } catch (e) {
    if (e instanceof AuthError) return;
    throw e;
  }
}
