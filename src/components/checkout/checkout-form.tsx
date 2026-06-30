'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { checkoutSubmitAction, checkEmailExistsAction } from '@/lib/checkout/actions';
import { inputClass, Alert } from '@/components/auth/ui';
import { COUNTRIES } from '@/lib/countries';
import { SecondCoinUpsell, type UpsellData } from '@/components/checkout/second-coin-upsell';

type Selected = 'reserve' | 'full';
type Mode = 'register' | 'login';

const STORE_KEY = 'lf-checkout';
// Datos memorizados (no se guarda la contraseña por seguridad).
type Stored = { email: string; firstName: string; lastName: string; phone: string; country: string };

export function CheckoutForm({
  club,
  isLoggedIn,
  reserveFormatted,
  fullFormatted,
  listFormatted,
  refCode,
  upsell = null,
  subscriptionMode = false,
}: {
  club: string;
  isLoggedIn: boolean;
  reserveFormatted: string;
  fullFormatted: string;
  listFormatted: string | null;
  refCode?: string;
  upsell?: UpsellData | null;
  subscriptionMode?: boolean;
}) {
  const tc = useTranslations('checkout');
  const ta = useTranslations('auth');
  const locale = useLocale();
  const [selected, setSelected] = useState<Selected>('reserve');
  const [mode, setMode] = useState<Mode>('register');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Campos controlados (para memorizarlos y comprobar el email en tiempo real).
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('ES');

  const [emailExists, setEmailExists] = useState(false);
  const [checking, setChecking] = useState(false);
  const manualMode = useRef(false); // el usuario forzó el modo con el enlace

  // Restaurar datos memorizados (no la contraseña).
  useEffect(() => {
    if (isLoggedIn) return;
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as Partial<Stored>;
        if (s.email) setEmail(s.email);
        if (s.firstName) setFirstName(s.firstName);
        if (s.lastName) setLastName(s.lastName);
        if (s.phone) setPhone(s.phone);
        if (s.country) setCountry(s.country);
      }
    } catch {
      /* ignore */
    }
  }, [isLoggedIn]);

  // Memorizar datos ante posibles errores (sin contraseña).
  useEffect(() => {
    if (isLoggedIn) return;
    const data: Stored = { email, firstName, lastName, phone, country };
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }, [isLoggedIn, email, firstName, lastName, phone, country]);

  // Comprobar en tiempo real si el correo ya está registrado (debounce).
  useEffect(() => {
    if (isLoggedIn) return;
    const e = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) {
      setEmailExists(false);
      if (!manualMode.current) setMode('register');
      return;
    }
    setChecking(true);
    const t = setTimeout(async () => {
      try {
        const exists = await checkEmailExistsAction(e);
        setEmailExists(exists);
        // Auto-cambio a "iniciar sesión" si ya existe (salvo override manual).
        if (!manualMode.current) setMode(exists ? 'login' : 'register');
      } finally {
        setChecking(false);
      }
    }, 450);
    return () => clearTimeout(t);
  }, [email, isLoggedIn]);

  function fieldMsg(code: string): string {
    return ta.has(`errors.${code}`) ? ta(`errors.${code}`) : code;
  }

  function onSubmit(formData: FormData) {
    setError(null);
    setFieldErrors({});
    formData.set('type', selected);
    formData.set('mode', mode);
    formData.set('club', club);
    formData.set('locale', locale);
    startTransition(async () => {
      const res = await checkoutSubmitAction(formData);
      if (res.ok) {
        try {
          localStorage.removeItem(STORE_KEY);
        } catch {
          /* ignore */
        }
        window.location.href = res.approveUrl;
        return;
      }
      if (res.fieldErrors) {
        const mapped: Record<string, string> = {};
        for (const [k, v] of Object.entries(res.fieldErrors)) mapped[k] = fieldMsg(v);
        setFieldErrors(mapped);
      }
      setError(tc.has(`errors.${res.code}`) ? tc(`errors.${res.code}`) : tc('errors.error'));
    });
  }

  // En login mostramos solo email + contraseña; en registro, datos completos.
  const showRegisterFields = mode === 'register' && !emailExists;

  return (
    <form action={onSubmit} className="space-y-6">
      {/* Selector de opción: reserva (por defecto) vs. pago completo */}
      <div className="grid gap-3 sm:grid-cols-2">
        <OptionCard
          active={selected === 'reserve'}
          onClick={() => setSelected('reserve')}
          title={tc('optionReserve')}
          desc={tc('optionReserveDesc')}
          price={reserveFormatted}
          selectedLabel={tc('selected')}
          chooseLabel={tc('choose')}
        />
        <OptionCard
          active={selected === 'full'}
          onClick={() => setSelected('full')}
          title={tc('optionFull')}
          desc={tc('optionFullDesc')}
          price={fullFormatted}
          strikePrice={listFormatted}
          selectedLabel={tc('selected')}
          chooseLabel={tc('choose')}
        />
      </div>

      {/* Upsell de 2ª moneda (solo Prestige): elegir incluida + añadir la segunda */}
      {upsell ? <SecondCoinUpsell data={upsell} /> : null}

      {!isLoggedIn ? (
        <div className="rounded-card border border-border bg-surface p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-lg text-foreground">{tc('account')}</h2>
            <button
              type="button"
              onClick={() => {
                manualMode.current = true;
                setMode((m) => (m === 'register' ? 'login' : 'register'));
                setError(null);
                setFieldErrors({});
              }}
              className="text-xs text-gold hover:underline"
            >
              {mode === 'register' ? tc('haveAccount') : tc('needAccount')}
            </button>
          </div>
          <p className="mt-1 text-sm text-muted">
            {mode === 'login' ? tc('loginHint') : tc('registerHint')}
          </p>

          {refCode ? <input type="hidden" name="ref" value={refCode} /> : null}

          {/* 1º correo electrónico (con comprobación en tiempo real) */}
          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm text-muted">{ta('emailLabel')}</span>
              <input
                className={inputClass}
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!fieldErrors.email}
              />
              {checking ? <span className="mt-1 block text-xs text-faint">{tc('checking')}</span> : null}
              {fieldErrors.email ? (
                <span className="mt-1 block text-xs text-red-400">{fieldErrors.email}</span>
              ) : null}
            </label>

            {emailExists && mode === 'login' ? (
              <p className="rounded border border-gold/40 bg-gold/10 px-3 py-2 text-xs text-foreground">
                {tc('emailKnown')}
              </p>
            ) : null}

            {/* 2º contraseña (con ver/ocultar) */}
            <label className="block">
              <span className="mb-1 block text-sm text-muted">{ta('passwordLabel')}</span>
              <span className="relative block">
                <input
                  className={`${inputClass} pr-20`}
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!fieldErrors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gold hover:underline"
                >
                  {showPassword ? tc('hidePassword') : tc('showPassword')}
                </button>
              </span>
              {showRegisterFields ? (
                <span className="mt-1 block text-xs text-faint">{tc('passwordHint')}</span>
              ) : null}
              {fieldErrors.password ? (
                <span className="mt-1 block text-xs text-red-400">{fieldErrors.password}</span>
              ) : null}
              {emailExists && mode === 'login' ? (
                <Link href="/forgot-password" className="mt-1 inline-block text-xs text-gold hover:underline">
                  {tc('forgotPassword')}
                </Link>
              ) : null}
            </label>

            {/* 3º resto de datos, solo al crear cuenta nueva */}
            {showRegisterFields ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-sm text-muted">{ta('firstNameLabel')}</span>
                    <input className={inputClass} name="firstName" required value={firstName} onChange={(e) => setFirstName(e.target.value)} aria-invalid={!!fieldErrors.firstName} />
                    {fieldErrors.firstName ? <span className="mt-1 block text-xs text-red-400">{fieldErrors.firstName}</span> : null}
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm text-muted">{ta('lastNameLabel')}</span>
                    <input className={inputClass} name="lastName" required value={lastName} onChange={(e) => setLastName(e.target.value)} aria-invalid={!!fieldErrors.lastName} />
                    {fieldErrors.lastName ? <span className="mt-1 block text-xs text-red-400">{fieldErrors.lastName}</span> : null}
                  </label>
                </div>
                <label className="block">
                  <span className="mb-1 block text-sm text-muted">{ta('phoneLabel')}</span>
                  <input className={inputClass} name="phone" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm text-muted">{ta('countryLabel')}</span>
                  <select name="country" required className={inputClass} value={country} onChange={(e) => setCountry(e.target.value)}>
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-start gap-2 text-sm text-muted">
                  <input type="checkbox" name="acceptTerms" className="mt-1" required />
                  <span>
                    {ta('termsLabel')}{' '}
                    (<Link href="/legal/terms" target="_blank" className="text-gold hover:underline">{tc('legalTermsLink')}</Link>
                    {' · '}
                    <Link href="/legal/privacy" target="_blank" className="text-gold hover:underline">{tc('legalPrivacyLink')}</Link>)
                  </span>
                </label>
                {fieldErrors.acceptTerms ? (
                  <span className="block text-xs text-red-400">{fieldErrors.acceptTerms}</span>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Divulgación de cobro recurrente antes de pagar la membresía */}
      {subscriptionMode && selected === 'full' ? (
        <p className="rounded-card border border-gold/40 bg-gold/10 px-4 py-3 text-xs text-foreground">
          {tc('recurringNotice', { price: fullFormatted })}
        </p>
      ) : null}

      {error ? <Alert kind="error">{error}</Alert> : null}

      <button
        type="submit"
        disabled={pending}
        className="bevel w-full bg-gold px-5 py-3.5 text-sm font-semibold uppercase tracking-[0.16em] text-[#1a1408] transition hover:bg-gold-light disabled:opacity-60"
      >
        {pending ? tc('processing') : tc('continue')}
      </button>
    </form>
  );
}

function OptionCard({
  active,
  onClick,
  title,
  desc,
  price,
  strikePrice,
  selectedLabel,
  chooseLabel,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  desc: string;
  price: string;
  strikePrice?: string | null;
  selectedLabel: string;
  chooseLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex flex-col rounded-card border p-4 text-left transition ${
        active ? 'border-gold bg-gold/10 ring-1 ring-gold/40' : 'border-border bg-surface hover:border-gold/40'
      }`}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="font-display text-base text-foreground">{title}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
            active ? 'bg-gold text-[#1a1408]' : 'border border-border text-faint'
          }`}
        >
          {active ? selectedLabel : chooseLabel}
        </span>
      </span>
      <span className="mt-2 flex items-baseline gap-2">
        {strikePrice ? <span className="text-sm text-faint line-through">{strikePrice}</span> : null}
        <span className="font-display text-2xl font-bold tabular-nums text-metal-gold">{price}</span>
      </span>
      <span className="mt-1 text-xs text-muted">{desc}</span>
    </button>
  );
}
