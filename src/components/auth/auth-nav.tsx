'use client';

import { Link } from '@/i18n/navigation';

// El cierre de sesión ya NO va aquí: se muestra al final del menú de la cuenta
// (ver LogoutButton en /account). La cabecera solo enlaza Panel y Mi cuenta.
export function AuthNav({
  isLoggedIn,
  isAdmin,
  accountLabel,
  adminLabel,
  loginLabel,
}: {
  isLoggedIn: boolean;
  isAdmin?: boolean;
  accountLabel: string;
  adminLabel: string;
  loginLabel: string;
  logoutLabel?: string;
}) {
  if (!isLoggedIn) {
    return (
      <Link
        href="/login"
        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-gold/50 bg-gold/10 px-4 py-1.5 text-sm font-medium text-gold-light transition hover:bg-gold/20 hover:text-gold"
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
    </div>
  );
}
