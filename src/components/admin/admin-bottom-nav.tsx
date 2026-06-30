'use client';

import { useTransition } from 'react';
import { logoutAction } from '@/lib/auth-actions';

// Acciones al fondo del menú admin: ir a la tienda y cerrar sesión.
export function AdminBottomNav() {
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-auto flex flex-col gap-1 border-t border-border pt-4">
      {/* Página principal del store */}
      <a
        href="/"
        className="rounded px-3 py-2 text-sm text-muted transition hover:bg-surface-elevated hover:text-foreground"
      >
        ← Ver la tienda
      </a>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await logoutAction();
            window.location.href = '/';
          })
        }
        className="rounded px-3 py-2 text-left text-sm text-red-400 transition hover:bg-surface-elevated disabled:opacity-60"
      >
        {pending ? 'Saliendo…' : 'Cerrar sesión'}
      </button>
    </div>
  );
}
