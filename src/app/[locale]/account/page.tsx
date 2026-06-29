import { getTranslations, setRequestLocale } from 'next-intl/server';
import { requireUser, isEmailVerified } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { Link } from '@/i18n/navigation';

// Panel de usuario mínimo (Módulo 1). Las secciones completas del doc 08 llegan en el Módulo 9.
export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await requireUser(locale);
  const t = await getTranslations({ locale, namespace: 'auth' });

  const profile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
    select: { firstName: true, lastName: true, preferredCurrency: true },
  });

  const verified = isEmailVerified(session);

  return (
    <section className="mx-auto max-w-2xl animate-fade-in">
      <h1 className="font-display text-3xl font-bold text-metal-gold">
        {profile ? `${profile.firstName} ${profile.lastName}` : session.user.email}
      </h1>
      <p className="mt-2 text-muted">{session.user.email}</p>

      {!verified ? (
        <div className="mt-4 rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-sm">
          {/* Aviso de verificación pendiente (gating de checkout, D-009) */}
          <p className="text-foreground">
            {t('verify.title')}: <span className="text-gold">pendiente</span>
          </p>
          <Link href="/verify-email" className="mt-1 inline-block text-gold hover:underline">
            {t('verify.resend')}
          </Link>
        </div>
      ) : null}

      <div className="mt-6 rounded-card border border-border bg-surface p-5 text-sm text-muted">
        <p>Moneda preferida: {profile?.preferredCurrency ?? 'EUR'}</p>
        <p className="mt-2">Las secciones de membresía, productos, puntos y referidos llegarán pronto.</p>
      </div>
    </section>
  );
}
