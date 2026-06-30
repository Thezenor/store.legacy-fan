import { getTranslations, setRequestLocale } from 'next-intl/server';
import { requireUser, isEmailVerified } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { formatMoney } from '@/lib/commerce/money';
import { getPointsSummary } from '@/lib/points/summary';
import { getReferralSummary } from '@/lib/referrals/stats';
import { DigitalMemberCard } from '@/components/brand/member-card';
import { issueMemberToken } from '@/lib/members/pass-token';
import { appUrl } from '@/lib/app-url';
import QRCode from 'qrcode';
import { FullPaymentButton } from '@/components/checkout/full-payment-button';
import { CancelSubscriptionFlow } from '@/components/account/cancel-subscription-flow';
import { AccountTabs, type AccountTab } from '@/components/account/account-tabs';
import { ChangePasswordForm } from '@/components/account/change-password-form';
import { updateOwnProfileAction, updateOwnAddressAction } from '@/lib/account-actions';
import { COUNTRIES } from '@/lib/countries';
import { Link } from '@/i18n/navigation';

const inputCls =
  'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition focus:border-gold focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-card border border-border bg-surface p-5">
      <h2 className="font-display text-xl font-semibold text-foreground">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default async function AccountPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    welcome?: string;
    reserved?: string;
    subscribed?: string;
    pending?: string;
    error?: string;
    saved?: string;
  }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const session = await requireUser(locale);
  const userId = session.user.id;

  const t = await getTranslations({ locale, namespace: 'auth' });
  const a = await getTranslations({ locale, namespace: 'account' });
  const co = await getTranslations({ locale, namespace: 'checkout' });
  const checkoutErrors = {
    unauthenticated: co('errors.unauthenticated'),
    unverified: co('errors.unverified'),
    already_member: co('errors.already_member'),
    error: co('errors.error'),
  };

  const [profile, reservation, membership, orders, payments, points, referral, subscription] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.reservation.findFirst({
      where: { userId, status: { in: ['RESERVA_PENDIENTE', 'PAGO_COMPLETO'] } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.membership.findUnique({ where: { userId }, include: { memberNumber: true } }),
    prisma.order.findMany({ where: { userId }, include: { items: true }, orderBy: { createdAt: 'desc' } }),
    prisma.payment.findMany({ where: { userId }, include: { invoice: true }, orderBy: { createdAt: 'desc' } }),
    getPointsSummary(userId),
    getReferralSummary(userId),
    prisma.subscription.findUnique({ where: { userId } }),
  ]);

  const banner = sp.welcome
    ? { kind: 'ok' as const, msg: a('bannerWelcome') }
    : sp.subscribed
      ? { kind: 'ok' as const, msg: a('bannerSubscribed') }
      : sp.reserved
        ? { kind: 'ok' as const, msg: a('bannerReserved') }
        : sp.saved === 'profile'
          ? { kind: 'ok' as const, msg: a('profileSaved') }
          : sp.saved === 'address'
            ? { kind: 'ok' as const, msg: a('addressSaved') }
            : sp.saved === 'downgraded'
              ? { kind: 'ok' as const, msg: a('bannerDowngraded') }
              : sp.saved === 'cancelled'
                ? { kind: 'warn' as const, msg: a('bannerCancelled') }
                : sp.pending
                  ? { kind: 'warn' as const, msg: a('bannerPending') }
                  : sp.error
                    ? { kind: 'err' as const, msg: a('bannerError') }
                    : null;

  const verified = isEmailVerified(session);
  const fullName = profile ? `${profile.firstName} ${profile.lastName}` : (session.user.email ?? '');
  const currency = profile?.preferredCurrency ?? 'EUR';
  const isMember = membership?.status === 'SOCIO_ACTIVO' && !!membership.memberNumber;

  // Carnet digital: QR firmado para el reverso (solo si el sistema está activo
  // en el panel y hay secreto configurado). El QR lleva un token firmado, no
  // datos personales en claro; se verifica en /api/verify-member.
  let memberQrDataUri: string | undefined;
  if (isMember) {
    const token = await issueMemberToken({
      userId,
      number: membership!.memberNumber!.formatted,
      tier: membership!.club,
    });
    if (token) {
      const url = `${appUrl()}/api/verify-member?token=${encodeURIComponent(token)}`;
      memberQrDataUri = await QRCode.toString(url, {
        type: 'svg',
        margin: 0,
        errorCorrectionLevel: 'M',
        color: { dark: '#0a0a0c', light: '#ffffff' },
      }).then((svg) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`);
    }
  }
  const fmtDate = (d: Date | null) =>
    d ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(d) : '—';
  const invoices = payments.filter((p) => p.invoice);

  const tabs: AccountTab[] = [];

  if (subscription) {
    tabs.push({
      id: 'suscripcion',
      label: a('subscriptionTitle'),
      node: (
        <Section title={a('subscriptionTitle')}>
          {subscription.status === 'CANCELADA' || subscription.cancelAtPeriodEnd ? (
            <p className="text-sm text-muted">{a('subCanceled')}</p>
          ) : subscription.status === 'ACTIVA' ? (
            <div className="space-y-2 text-sm">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
                <dt className="text-muted">{a('subAmount')}</dt>
                <dd className="text-foreground">{formatMoney(subscription.amountCents, subscription.currency, locale)}</dd>
                <dt className="text-muted">{a('subRenews')}</dt>
                <dd className="text-foreground">{fmtDate(subscription.currentPeriodEnd)}</dd>
              </dl>
              <p className="text-xs text-muted">{a('subActiveNote')}</p>
              <CancelSubscriptionFlow canDowngrade={membership?.club === 'PRESTIGE'} />
            </div>
          ) : (
            <p className="text-sm text-muted">{subscription.status.replaceAll('_', ' ').toLowerCase()}</p>
          )}
        </Section>
      ),
    });
  }

  if (isMember) {
    tabs.push({
      id: 'membresia',
      label: a('membershipTitle'),
      node: (
        <Section title={a('summaryTitle')}>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
            <dt className="text-muted">{a('club')}</dt>
            <dd className="text-foreground">{membership!.club}</dd>
            <dt className="text-muted">{a('memberNumber')}</dt>
            <dd className="text-gold-light">{membership!.memberNumber!.formatted}</dd>
            <dt className="text-muted">{a('since')}</dt>
            <dd className="text-foreground">{fmtDate(membership!.startsAt)}</dd>
            <dt className="text-muted">{a('until')}</dt>
            <dd className="text-foreground">{fmtDate(membership!.endsAt)}</dd>
          </dl>
        </Section>
      ),
    });
    tabs.push({
      id: 'productos',
      label: a('productsTitle'),
      node: (
        <Section title={a('productsTitle')}>
          {orders.flatMap((o) => o.items).length === 0 ? (
            <p className="text-sm text-muted">{a('noProducts')}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {orders.flatMap((o) => o.items).map((it) => (
                <li key={it.id} className="flex justify-between gap-3 border-b border-border/60 pb-2">
                  <span className="min-w-0 truncate text-foreground">{it.name}</span>
                  <span className="shrink-0 text-xs text-muted">{it.status.replaceAll('_', ' ').toLowerCase()}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      ),
    });
    tabs.push({
      id: 'comunidad',
      label: a('communityTitle'),
      node: (
        <Section title={a('communityTitle')}>
          <p className="text-sm text-muted">{a('communitySoon')}</p>
        </Section>
      ),
    });
  } else if (reservation) {
    tabs.push({
      id: 'reserva',
      label: a('reservationTitle'),
      node: (
        <Section title={a('reservationTitle')}>
          <p className="text-sm text-gold">{a('statusReservaPendiente')}</p>
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
        </Section>
      ),
    });
  }

  tabs.push({
    id: 'puntos',
    label: a('pointsTitle'),
    node: (
      <Section title={a('pointsTitle')}>
        <p className="text-sm text-muted">
          {a('balance')}:{' '}
          <span className="font-display text-2xl text-metal-gold">
            {formatMoney(points.balanceCents, currency, locale)}
          </span>
        </p>
        {points.transactions.length > 0 ? (
          <ul className="mt-3 space-y-1 text-xs text-muted">
            {points.transactions.map((tx) => (
              <li key={tx.id} className="flex justify-between gap-3">
                <span className="min-w-0 truncate">{tx.reason ?? tx.type}</span>
                <span className={`shrink-0 ${tx.amountCents >= 0 ? 'text-state-green' : 'text-red-400'}`}>
                  {tx.amountCents >= 0 ? '+' : ''}
                  {formatMoney(tx.amountCents, currency, locale)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-muted">{a('noActivity')}</p>
        )}
      </Section>
    ),
  });

  if (referral) {
    tabs.push({
      id: 'referidos',
      label: a('referralsTitle'),
      node: (
        <Section title={a('referralsTitle')}>
          <p className="text-sm text-muted">
            {a('yourCode')}: <span className="font-mono text-gold-light">{referral.code}</span>
          </p>
          <p className="mt-1 text-xs text-muted">
            {a('yourLink')}: <span className="block break-all text-foreground">{referral.link}</span>
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2 text-center text-sm sm:grid-cols-3">
            <div className="rounded border border-border p-2">
              <div className="text-lg text-foreground">{referral.registered}</div>
              <div className="text-[11px] text-muted">{a('registered')}</div>
            </div>
            <div className="rounded border border-border p-2">
              <div className="text-lg text-foreground">{referral.conversion}%</div>
              <div className="text-[11px] text-muted">{a('conversion')}</div>
            </div>
            <div className="rounded border border-border p-2">
              <div className="text-lg text-gold-light">
                {formatMoney(referral.generatedCents, currency, locale)}
              </div>
              <div className="text-[11px] text-muted">{a('generated')}</div>
            </div>
          </div>
        </Section>
      ),
    });
  }

  tabs.push({
    id: 'pedidos',
    label: a('ordersTitle'),
    node: (
      <Section title={a('ordersTitle')}>
        {invoices.length === 0 && orders.length === 0 ? (
          <p className="text-sm text-muted">{a('noOrders')}</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {invoices.map((p) => (
              <li key={p.id} className="flex justify-between gap-3">
                <span className="min-w-0 truncate text-foreground">
                  {a('invoice')} {p.invoice!.number}
                </span>
                <span className="shrink-0 text-gold-light">
                  {formatMoney(p.invoice!.totalCents, p.invoice!.currency, locale)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    ),
  });

  // Dirección de envío (editable; se rellena automáticamente desde PayPal).
  tabs.push({
    id: 'direccion',
    label: a('addressTitle'),
    node: (
      <Section title={a('addressTitle')}>
        <p className="text-sm text-muted">{a('addressHint')}</p>
        <form action={updateOwnAddressAction} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <input type="hidden" name="locale" value={locale} />
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm text-muted">{a('addrName')}</span>
            <input name="shippingName" defaultValue={profile?.shippingName ?? ''} className={inputCls} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm text-muted">{a('addrLine1')}</span>
            <input name="addressLine1" defaultValue={profile?.addressLine1 ?? ''} className={inputCls} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm text-muted">{a('addrLine2')}</span>
            <input name="addressLine2" defaultValue={profile?.addressLine2 ?? ''} className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-muted">{a('addrCity')}</span>
            <input name="city" defaultValue={profile?.city ?? ''} className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-muted">{a('addrRegion')}</span>
            <input name="region" defaultValue={profile?.region ?? ''} className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-muted">{a('addrPostal')}</span>
            <input name="postalCode" defaultValue={profile?.postalCode ?? ''} className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-muted">{t('countryLabel')}</span>
            <select name="country" defaultValue={profile?.country ?? 'ES'} className={inputCls}>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-2">
            <button className="bevel bg-gold px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#1a1408] transition hover:bg-gold-light">
              {a('saveAddress')}
            </button>
          </div>
        </form>
      </Section>
    ),
  });

  tabs.push({
    id: 'perfil',
    label: a('profileTitle'),
    node: (
      <Section title={a('profileTitle')}>
        <p className="text-sm text-muted">
          {t('emailLabel')}: <span className="text-foreground">{session.user.email}</span>
        </p>
        <p className="mt-1 text-sm text-muted">
          {a('subscriptionTitle')}:{' '}
          <span className="text-foreground">
            {!subscription
              ? a('subStatusNone')
              : subscription.status === 'ACTIVA' && !subscription.cancelAtPeriodEnd
                ? a('subStatusActive')
                : a('subStatusCancelled')}
          </span>
        </p>
        <form action={updateOwnProfileAction} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <input type="hidden" name="locale" value={locale} />
          <label className="block">
            <span className="mb-1 block text-sm text-muted">{t('firstNameLabel')}</span>
            <input name="firstName" defaultValue={profile?.firstName ?? ''} required className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-muted">{t('lastNameLabel')}</span>
            <input name="lastName" defaultValue={profile?.lastName ?? ''} required className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-muted">{t('phoneLabel')}</span>
            <input name="phone" type="tel" defaultValue={profile?.phone ?? ''} className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-muted">{t('countryLabel')}</span>
            <select name="country" defaultValue={profile?.country ?? 'ES'} className={inputCls}>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-muted">{a('currency')}</span>
            <select name="currency" defaultValue={currency} className={inputCls}>
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
            </select>
          </label>
          <div className="sm:col-span-2">
            <button className="bevel bg-gold px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#1a1408] transition hover:bg-gold-light">
              {a('saveProfile')}
            </button>
          </div>
        </form>
      </Section>
    ),
  });

  tabs.push({
    id: 'password',
    label: a('passwordTitle'),
    node: (
      <Section title={a('passwordTitle')}>
        <ChangePasswordForm />
      </Section>
    ),
  });

  return (
    <section className="mx-auto max-w-3xl animate-fade-in">
      <h1 className="font-display text-3xl font-bold text-metal-gold">{fullName}</h1>
      <p className="mt-2 text-muted">{session.user.email}</p>

      {banner ? (
        <p
          className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
            banner.kind === 'ok'
              ? 'border-green-500/40 bg-green-500/10 text-green-300'
              : banner.kind === 'warn'
                ? 'border-gold/40 bg-gold/10 text-foreground'
                : 'border-red-500/40 bg-red-500/10 text-red-300'
          }`}
        >
          {banner.msg}
        </p>
      ) : null}

      {!verified ? (
        <div className="mt-4 rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-sm">
          <p className="text-foreground">{t('verify.title')}</p>
          <Link href="/verify-email" className="mt-1 inline-block text-gold hover:underline">
            {t('verify.resend')}
          </Link>
        </div>
      ) : null}

      {/* Carnet digital (anverso + reverso). Permanente desde el primer pago. */}
      {isMember ? (
        <div className="mt-6 grid max-w-md gap-4 sm:max-w-2xl sm:grid-cols-2">
          <DigitalMemberCard name={fullName} number={membership!.memberNumber!.formatted} side="front" />
          <DigitalMemberCard
            name={fullName}
            number={membership!.memberNumber!.formatted}
            side="back"
            qrDataUri={memberQrDataUri}
          />
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

      <AccountTabs items={tabs} />
    </section>
  );
}
