'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { verifyEmailAction, resendVerificationAction } from '@/lib/auth-actions';
import { AuthCard, Alert } from '@/components/auth/ui';

type State = 'verifying' | 'success' | 'error';

export default function VerifyEmailPage() {
  const t = useTranslations('auth');
  const locale = useLocale() as 'es' | 'en' | 'fr' | 'it';
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const email = params.get('email') ?? '';
  const [state, setState] = useState<State>('verifying');
  const [resent, setResent] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!token || !email) {
        if (active) setState('error');
        return;
      }
      const res = await verifyEmailAction(email, token);
      if (active) setState(res.ok ? 'success' : 'error');
    })();
    return () => {
      active = false;
    };
  }, [token, email]);

  async function resend() {
    if (!email) return;
    await resendVerificationAction(email, locale);
    setResent(true);
  }

  return (
    <AuthCard title={t('verify.title')}>
      {state === 'verifying' ? <p className="text-muted">{t('verify.verifying')}</p> : null}
      {state === 'success' ? (
        <>
          <Alert kind="success">{t('verify.success')}</Alert>
          <p className="mt-4 text-sm">
            <Link href="/login" className="text-gold hover:underline">
              {t('verify.continue')}
            </Link>
          </p>
        </>
      ) : null}
      {state === 'error' ? (
        <>
          <Alert kind="error">{t('errors.token_invalid')}</Alert>
          {resent ? (
            <p className="mt-4 text-sm text-green-300">{t('verify.resent')}</p>
          ) : (
            <button
              type="button"
              onClick={resend}
              className="mt-4 text-sm text-gold hover:underline"
            >
              {t('verify.resend')}
            </button>
          )}
        </>
      ) : null}
    </AuthCard>
  );
}
