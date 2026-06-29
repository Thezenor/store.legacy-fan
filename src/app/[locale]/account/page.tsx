import { getTranslations, setRequestLocale } from 'next-intl/server';
import { requireUser, isEmailVerified } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { formatMoney } from '@/lib/commerce/money';
import { DigitalMemberCard } from '@/components/brand/member-card';
import { FullPaymentButton } from '@/components/checkout/full-payment-button';
import { Link } from '@/i18n/navigation';

// Panel de usuario (Módulo 1 + reserva del Módulo 4). Secciones completas: Módulo 9.
export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await requireUser(locale);
  const t = await getTranslations({ locale, namespace: 'auth' });
  const a = await getTranslations({ locale, namespace: 'account' });
  const co = await getTranslations({ locale, namespace: 'checkout' });
  const checkoutErrors = {
    unauthenticated: co('errors.unauthenticated'),
    unverified: co('errors.unverified'),
    already_member: co('errors.already_member'),
    error: co('errors.error'),
  };

  const [profile, reservation, membership] = await Promise.all([
    prisma.userProfile.findUnique({
      where: { userId: session.user.id },
      select: { firstName: true, lastName: true, preferredCurrency: true },
    }),
    prisma.reservation.findFirst({
      where: { userId: session.user.id, status: { in: ['RESERVA_PENDIENTE', 'PAGO_COMPLETO'] } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.membership.findUnique({
      where: { userId: session.user.id },
      include: { memberNumber: true },
    }),
  ]);

  const verified = isEmailVerified(session);
  const fullName = profile ? `${profile.firstName} ${profile.lastName}` : (session.user.email ?? '');

  return (
    <section className="mx-auto max-w-2xl animate-fade-in">
      <h1 className="font-display text-3xl font-bold text-metal-gold">
        {profile ? `${profile.firstName} ${profile.lastName}` : session.user.email}
      </h1>
      <p className="mt-2 text-muted">{session.user.email}</p>

      {!verified ? (
        <div className="mt-4 rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-sm">
          <p className="text-foreground">
            {t('verify.title')}: <span className="text-gold">pendiente</span>
          </p>
          <Link href="/verify-email" className="mt-1 inline-block text-gold hover:underline">
            {t('verify.resend')}
          </Link>
        </div>
      ) : null}

      {/* Carnet digital: activo si hay membresía con número; vista previa si solo hay reserva */}
      {membership?.memberNumber ? (
        <div className="mt-6 max-w-md">
          <DigitalMemberCard name={fullName} number={membership.memberNumber.formatted} />
        </div>
      ) : reservation ? (
        <div className="mt-6 max-w-md">
          <DigitalMemberCard
            name={fullName}
            number="LF-——————"
            active={false}
            pendingLabel={a('statusReservaPendiente')}
          />
        </div>
      ) : null}

      {reservation ? (
        <div className="mt-6 rounded-card border border-border bg-surface p-5">
          <h2 className="font-display text-xl font-bold text-foreground">{a('reservationTitle')}</h2>
          <p className="mt-1 text-sm text-gold">{a('statusReservaPendiente')}</p>
          <div className="mt-3 space-y-1 text-sm text-muted">
            <p>
              {a('paid')}:{' '}
              <span className="text-foreground">
                {formatMoney(reservation.amountPaidCents, reservation.currency, locale)}
              </span>
            </p>
            {reservation.totalDueCents > 0 ? (
              <p>
                {a('remaining')}:{' '}
                <span className="text-foreground">
                  {formatMoney(
                    Math.max(0, reservation.totalDueCents - reservation.amountPaidCents),
                    reservation.currency,
                    locale,
                  )}
                </span>
              </p>
            ) : null}
          </div>
          <p className="mt-3 text-xs text-muted">{a('noMemberNumberYet')}</p>
          {/* Pagar el restante para completar la membresía (M6) */}
          <div className="mt-4">
            {reservation.club ? (
              <FullPaymentButton
                club={reservation.club}
                label={co('payFull')}
                pendingLabel={co('processing')}
                errors={checkoutErrors}
              />
            ) : (
              <Link href="/club" className="text-sm text-gold hover:underline">
                {co('back')}
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-card border border-border bg-surface p-5 text-sm text-muted">
          <p>
            {a('currency')}: {profile?.preferredCurrency ?? 'EUR'}
          </p>
          <p className="mt-2">Las secciones de membresía, productos, puntos y referidos llegarán pronto.</p>
        </div>
      )}
    </section>
  );
}
