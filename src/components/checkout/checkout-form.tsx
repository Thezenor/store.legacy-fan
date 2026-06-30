'use client';

import { useState, useTransition } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { checkoutSubmitAction } from '@/lib/checkout/actions';
import { inputClass, Field, Alert } from '@/components/auth/ui';
import { COUNTRIES } from '@/lib/countries';

type Selected = 'reserve' | 'full';
type Mode = 'register' | 'login';

export function CheckoutForm({
  club,
  isLoggedIn,
  reserveFormatted,
  fullFormatted,
  listFormatted,
  refCode,
}: {
  club: string;
  isLoggedIn: boolean;
  reserveFormatted: string;
  fullFormatted: string;
  listFormatted: string | null;
  refCode?: string;
}) {
  const tc = useTranslations('checkout');
  const ta = useTranslations('auth');
  const locale = useLocale();
  const [selected, setSelected] = useState<Selected>('reserve');
  const [mode, setMode] = useState<Mode>('register');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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

      {/* Datos: registro (por defecto) o acceso si ya es cliente */}
      {!isLoggedIn ? (
        <div className="rounded-card border border-border bg-surface p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-lg text-foreground">{tc('account')}</h2>
            <button
              type="button"
              onClick={() => {
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
            {mode === 'register' ? tc('registerHint') : tc('loginHint')}
          </p>

          {refCode ? <input type="hidden" name="ref" value={refCode} /> : null}

          {mode === 'register' ? (
            <div className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={ta('firstNameLabel')} name="firstName" required error={fieldErrors.firstName} />
                <Field label={ta('lastNameLabel')} name="lastName" required error={fieldErrors.lastName} />
              </div>
              <Field label={ta('phoneLabel')} name="phone" type="tel" autoComplete="tel" error={fieldErrors.phone} />
              <label className="block">
                <span className="mb-1 block text-sm text-muted">{ta('countryLabel')}</span>
                <select name="country" required className={inputClass} defaultValue="ES">
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <Field label={ta('emailLabel')} name="email" type="email" required autoComplete="email" error={fieldErrors.email} />
              <Field
                label={ta('passwordLabel')}
                name="password"
                type="password"
                required
                autoComplete="new-password"
                error={fieldErrors.password}
              />
              <label className="flex items-start gap-2 text-sm text-muted">
                <input type="checkbox" name="acceptTerms" className="mt-1" required />
                <span>{ta('termsLabel')}</span>
              </label>
              {fieldErrors.acceptTerms ? (
                <span className="block text-xs text-red-400">{fieldErrors.acceptTerms}</span>
              ) : null}
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <Field label={ta('emailLabel')} name="email" type="email" required autoComplete="email" />
              <Field label={ta('passwordLabel')} name="password" type="password" required autoComplete="current-password" />
            </div>
          )}
        </div>
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
