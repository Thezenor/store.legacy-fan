'use client';

import { deleteUserAction } from '@/lib/admin-actions';

// Botón de eliminar con confirmación (evita borrados accidentales).
export function DeleteUserButton({ userId, email }: { userId: string; email: string }) {
  return (
    <form
      action={deleteUserAction}
      onSubmit={(e) => {
        if (!window.confirm(`¿Eliminar a ${email}? Se borran todos sus datos y no se puede deshacer.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <button
        type="submit"
        className="rounded border border-red-500/40 px-2 py-1 text-xs text-red-400 hover:bg-red-500/10"
      >
        Eliminar
      </button>
    </form>
  );
}
