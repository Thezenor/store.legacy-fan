'use client';

import { useEffect, useState } from 'react';

/**
 * Toggle de tema. Oscuro por defecto (doc 12): el modo claro añade la clase
 * `.light` en <html>. Persiste la preferencia en localStorage.
 */
export function ThemeToggle({ label }: { label: string }) {
  const [light, setLight] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('lf-theme');
    const isLight = stored === 'light';
    setLight(isLight);
    document.documentElement.classList.toggle('light', isLight);
  }, []);

  function toggle() {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle('light', next);
    localStorage.setItem('lf-theme', next ? 'light' : 'dark');
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-xs text-foreground transition hover:bg-surface-elevated"
    >
      {light ? '☀️' : '🌙'}
    </button>
  );
}
