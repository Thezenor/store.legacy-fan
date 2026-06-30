'use client';

import { useTransition } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { logoutAction } from '@/lib/auth-actions';

export function AuthNav({
  isLoggedIn,
  isAdmin,
  accountLabel,
  adminLabel,
  loginLabel,
  logoutLabel,
}: {
  isLoggedIn: boolean;
  isAdmin?: boolean;
  accountLabel: string;
  adminLabel: string;
  loginLabel: string;
  logoutLabel: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (!isLoggedIn) {
    return (
      <Link
        href="/login"
        className="inline-flex min-h-[40px] items-center text-sm text-muted hover:text-foreground"
      >
        {loginLabel}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {isAdmin ? (
        // /lf-admin está fuera del enrutado i18n: enlace normal.
        <a
          href="/lf-admin"
          className="inline-flex min-h-[40px] items-center text-sm font-semibold text-gold-light hover:text-gold"
        >
          {adminLabel}
        </a>
      ) : null}
      <Link
        href="/account"
        className="inline-flex min-h-[40px] items-center text-sm text-muted hover:text-foreground"
      >
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
        className="inline-flex min-h-[40px] items-center text-sm text-muted hover:text-foreground disabled:opacity-60"
      >
        {logoutLabel}
      </button>
    </div>
  );
}
