'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { loginAction } from '@/lib/auth-actions';
import { AuthCard, Field, SubmitButton, Alert } from '@/components/auth/ui';

export default function LoginPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setError(null);
    const res = await loginAction(formData);
    if (res.ok) {
      router.push('/account');
      router.refresh();
    } else {
      setError(t(`errors.${res.code}`));
    }
  }

  return (
    <AuthCard title={t('login.title')}>
      <form action={onSubmit} className="space-y-4">
        {error ? <Alert kind="error">{error}</Alert> : null}
        <Field label={t('emailLabel')} name="email" type="email" required autoComplete="email" />
        <Field
          label={t('passwordLabel')}
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
        <SubmitButton label={t('login.submit')} pendingLabel={t('processing')} />
      </form>
      <div className="mt-4 space-y-2 text-sm text-muted">
        <Link href="/forgot-password" className="text-gold hover:underline">
          {t('login.forgot')}
        </Link>
        <p>
          {t('login.noAccount')}{' '}
          <Link href="/register" className="text-gold hover:underline">
            {t('login.registerCta')}
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
