'use client';

import { useTransition } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { logoutAction } from '@/lib/auth-actions';

export function AuthNav({
  isLoggedIn,
  accountLabel,
  loginLabel,
  logoutLabel,
}: {
  isLoggedIn: boolean;
  accountLabel: string;
  loginLabel: string;
  logoutLabel: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (!isLoggedIn) {
    return (
      <Link href="/login" className="text-sm text-muted hover:text-foreground">
        {loginLabel}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/account" className="text-sm text-muted hover:text-foreground">
        {accountLabel}
      </Link>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await logoutAction();
            router.push('/');
            router.refresh();
          })
        }
        className="text-sm text-muted hover:text-foreground disabled:opacity-60"
      >
        {logoutLabel}
      </button>
    </div>
  );
}
