'use client';

import { cancelOwnSubscriptionAction } from '@/lib/account-actions';

export function CancelSubscriptionButton({ label, confirmText }: { label: string; confirmText: string }) {
  return (
    <form
      action={cancelOwnSubscriptionAction}
      onSubmit={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
    >
      <button
        type="submit"
        className="rounded border border-red-500/40 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10"
      >
        {label}
      </button>
    </form>
  );
}
