'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { changeOwnPasswordAction } from '@/lib/account-actions';

const inputCls =
  'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground outline-none transition focus:border-gold focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background';

export function ChangePasswordForm() {
  const a = useTranslations('account');
  const ta = useTranslations('auth');
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [show, setShow] = useState(false);

  function onSubmit(formData: FormData) {
    setMsg(null);
    start(async () => {
      const res = await changeOwnPasswordAction(null, formData);
      if (res.ok) {
        setMsg({ ok: true, text: a('pwdChanged') });
        (document.getElementById('change-password-form') as HTMLFormElement | null)?.reset();
      } else {
        const key = `pwdErr_${res.code}`;
        setMsg({ ok: false, text: a.has(key) ? a(key) : a('pwdErr_generic') });
      }
    });
  }

  return (
    <form id="change-password-form" action={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <label className="block sm:col-span-2">
        <span className="mb-1 block text-sm text-muted">{a('currentPassword')}</span>
        <input name="current" type={show ? 'text' : 'password'} required autoComplete="current-password" className={inputCls} />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm text-muted">{a('newPassword')}</span>
        <input name="next" type={show ? 'text' : 'password'} required autoComplete="new-password" className={inputCls} />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm text-muted">{ta('confirmPasswordLabel')}</span>
        <input name="confirm" type={show ? 'text' : 'password'} required autoComplete="new-password" className={inputCls} />
      </label>
      <label className="flex items-center gap-2 text-xs text-muted sm:col-span-2">
        <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> {a('showPasswords')}
      </label>
      <p className="text-xs text-faint sm:col-span-2">{a('pwdHint')}</p>
      {msg ? (
        <p className={`text-sm sm:col-span-2 ${msg.ok ? 'text-green-400' : 'text-red-400'}`}>{msg.text}</p>
      ) : null}
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="bevel bg-gold px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#1a1408] transition hover:bg-gold-light disabled:opacity-60"
        >
          {pending ? ta('processing') : a('changePassword')}
        </button>
      </div>
    </form>
  );
}
