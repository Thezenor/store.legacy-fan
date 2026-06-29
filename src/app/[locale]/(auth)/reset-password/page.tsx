'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { resetPasswordAction } from '@/lib/auth-actions';
import { AuthCard, Field, SubmitButton, Alert } from '@/components/auth/ui';

export default function ResetPasswordPage() {
  const t = useTranslations('auth');
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const email = params.get('email') ?? '';
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(formData: FormData) {
    setError(null);
    setFieldErrors({});
    const res = await resetPasswordAction(formData);
    if (res.ok) {
      setDone(true);
    } else {
      if (res.fieldErrors) {
        const mapped: Record<string, string> = {};
        for (const [k, v] of Object.entries(res.fieldErrors)) mapped[k] = t(`errors.${v}`);
        setFieldErrors(mapped);
      }
      setError(t(`errors.${res.code}`));
    }
  }

  return (
    <AuthCard title={t('reset.title')}>
      {done ? (
        <>
          <Alert kind="success">{t('reset.success')}</Alert>
          <p className="mt-4 text-sm">
            <Link href="/login" className="text-gold hover:underline">
              {t('reset.goLogin')}
            </Link>
          </p>
        </>
      ) : (
        <form action={onSubmit} className="space-y-4">
          {error ? <Alert kind="error">{error}</Alert> : null}
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="email" value={email} />
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
          <SubmitButton label={t('reset.submit')} pendingLabel={t('processing')} />
        </form>
      )}
    </AuthCard>
  );
}
