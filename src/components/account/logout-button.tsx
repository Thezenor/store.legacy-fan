'use client';

import { useTransition } from 'react';
import { useRouter } from '@/i18n/navigation';
import { logoutAction } from '@/lib/auth-actions';

// Botón de cierre de sesión para el pie del menú de la cuenta. Rojo apagado
// (no vivo) para identificarlo claramente como la salida.
export function LogoutButton({ label }: { label: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
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
      className="w-full rounded border border-[#b4544e]/45 px-3 py-2 text-left text-sm text-[#c0605a] transition hover:border-[#b4544e]/70 hover:bg-[#b4544e]/10 disabled:opacity-60"
    >
      {label}
    </button>
  );
}
