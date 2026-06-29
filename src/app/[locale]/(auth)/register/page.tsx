'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { registerAction } from '@/lib/auth-actions';
import { AuthCard, Field, SubmitButton, Alert, inputClass } from '@/components/auth/ui';
import { COUNTRIES } from '@/lib/countries';

export default function RegisterPage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(formData: FormData) {
    setError(null);
    setFieldErrors({});
    const res = await registerAction(formData);
    if (res.ok) {
      setSuccess(true);
    } else {
      if (res.fieldErrors) {
        const mapped: Record<string, string> = {};
        for (const [k, v] of Object.entries(res.fieldErrors)) mapped[k] = t(`errors.${v}`);
        setFieldErrors(mapped);
      }
      setError(t(`errors.${res.code}`));
    }
  }

  if (success) {
    return (
      <AuthCard title={t('register.title')}>
        <Alert kind="success">{t('register.success')}</Alert>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t('register.title')}>
      <form action={onSubmit} className="space-y-4">
        {error ? <Alert kind="error">{error}</Alert> : null}
        <input type="hidden" name="locale" value={locale} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('firstNameLabel')} name="firstName" required error={fieldErrors.firstName} />
          <Field label={t('lastNameLabel')} name="lastName" required error={fieldErrors.lastName} />
        </div>
        <Field label={t('phoneLabel')} name="phone" type="tel" autoComplete="tel" />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm text-muted">{t('countryLabel')}</span>
            <select name="country" required className={inputClass} defaultValue="ES">
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-muted">{t('currencyLabel')}</span>
            <select name="currency" className={inputClass} defaultValue="EUR">
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
            </select>
          </label>
        </div>
        <Field label={t('emailLabel')} name="email" type="email" required autoComplete="email" error={fieldErrors.email} />
        <Field
          label={t('passwordLabel')}
          name="password"
          type="password"
          required
          autoComplete="new-password"
          error={fieldErrors.password}
        />
        <Field
          label={t('confirmPasswordLabel')}
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          error={fieldErrors.confirmPassword}
        />
        <label className="flex items-start gap-2 text-sm text-muted">
          <input type="checkbox" name="acceptTerms" className="mt-1" required />
          <span>{t('termsLabel')}</span>
        </label>
        {fieldErrors.acceptTerms ? (
          <span className="block text-xs text-red-400">{fieldErrors.acceptTerms}</span>
        ) : null}
        <SubmitButton label={t('register.submit')} pendingLabel={t('processing')} />
      </form>
      <p className="mt-4 text-sm text-muted">
        {t('register.haveAccount')}{' '}
        <Link href="/login" className="text-gold hover:underline">
          {t('register.loginCta')}
        </Link>
      </p>
    </AuthCard>
  );
}
