'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

const KEY = 'lf-cookie-consent';

// Banner de consentimiento de cookies. Solo usamos cookies técnicas + opcionales
// futuras; guarda la elección en localStorage y no vuelve a mostrarse.
export function CookieConsent() {
  const t = useTranslations('cookieBanner');
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      /* ignore */
    }
  }, []);

  if (!show) return null;
  const choose = (v: 'accepted' | 'rejected') => {
    try {
      localStorage.setItem(KEY, v);
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-border bg-surface/95 p-4 backdrop-blur-md">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">
          {t('text')}{' '}
          <Link href="/legal/cookies" className="text-gold hover:underline">
            {t('more')}
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => choose('rejected')}
            className="rounded border border-border px-3 py-1.5 text-xs text-muted hover:text-foreground"
          >
            {t('reject')}
          </button>
          <button
            type="button"
            onClick={() => choose('accepted')}
            className="bevel bg-gold px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#1a1408]"
          >
            {t('accept')}
          </button>
        </div>
      </div>
    </div>
  );
}
