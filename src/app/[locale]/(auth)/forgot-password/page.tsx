'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { forgotPasswordAction } from '@/lib/auth-actions';
import { AuthCard, Field, SubmitButton, Alert } from '@/components/auth/ui';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setError(null);
    const res = await forgotPasswordAction(formData);
    if (res.ok) setDone(true);
    else setError(t(`errors.${res.code}`));
  }

  return (
    <AuthCard title={t('forgot.title')}>
      {done ? (
        <Alert kind="success">{t('forgot.success')}</Alert>
      ) : (
        <form action={onSubmit} className="space-y-4">
          {error ? <Alert kind="error">{error}</Alert> : null}
          <input type="hidden" name="locale" value={locale} />
          <p className="text-sm text-muted">{t('forgot.intro')}</p>
          <Field label={t('emailLabel')} name="email" type="email" required autoComplete="email" />
          <SubmitButton label={t('forgot.submit')} pendingLabel={t('processing')} />
        </form>
      )}
      <p className="mt-4 text-sm">
        <Link href="/login" className="text-gold hover:underline">
          {t('forgot.back')}
        </Link>
      </p>
    </AuthCard>
  );
}
