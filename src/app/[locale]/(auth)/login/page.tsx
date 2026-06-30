'use client';

import { useActionState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { loginAction, type ActionResult } from '@/lib/auth-actions';
import { AuthCard, Field, SubmitButton, Alert } from '@/components/auth/ui';

export default function LoginPage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const [state, formAction] = useActionState<ActionResult | null, FormData>(loginAction, null);
  const error = state && !state.ok ? t(`errors.${state.code}`) : null;

  return (
    <AuthCard title={t('login.title')}>
      <form action={formAction} className="space-y-4">
        {error ? <Alert kind="error">{error}</Alert> : null}
        <input type="hidden" name="locale" value={locale} />
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
