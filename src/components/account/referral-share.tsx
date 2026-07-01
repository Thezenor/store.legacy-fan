'use client';

import { useEffect, useState } from 'react';

// Iconos SVG de marca (viewBox 24x24), monocromo blanco sobre círculo de color.
const ICONS: Record<string, string> = {
  whatsapp:
    'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z',
  telegram:
    'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212-.07-.062-.174-.041-.249-.024-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z',
  facebook:
    'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  x: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  email:
    'M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z',
};

function Icon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
      <path d={ICONS[name]} />
    </svg>
  );
}

export function ReferralShare({
  link,
  shareText,
  copyLabel,
  copiedLabel,
  nativeLabel,
  logoUrl,
}: {
  link: string;
  shareText: string;
  copyLabel: string;
  copiedLabel: string;
  nativeLabel: string;
  logoUrl?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [canNative, setCanNative] = useState(false);
  const enc = encodeURIComponent;
  const textUrl = `${shareText} ${link}`;

  useEffect(() => {
    setCanNative(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);

  // Compartir nativo (hoja del sistema): adjunta el logo como imagen si el
  // dispositivo lo permite; si no, comparte solo texto + enlace.
  async function nativeShare() {
    const data: ShareData = { title: 'Legacy Fan Club', text: shareText, url: link };
    try {
      if (logoUrl && typeof navigator.canShare === 'function') {
        try {
          const res = await fetch(logoUrl);
          const blob = await res.blob();
          const file = new File([blob], 'legacy-fan.jpg', { type: blob.type || 'image/jpeg' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ ...data, files: [file] });
            return;
          }
        } catch {
          /* si falla la imagen, seguimos sin ella */
        }
      }
      await navigator.share(data);
    } catch {
      /* el usuario canceló */
    }
  }

  const nets = [
    { name: 'WhatsApp', icon: 'whatsapp', color: '#25D366', href: `https://wa.me/?text=${enc(textUrl)}` },
    { name: 'Telegram', icon: 'telegram', color: '#229ED9', href: `https://t.me/share/url?url=${enc(link)}&text=${enc(shareText)}` },
    { name: 'Facebook', icon: 'facebook', color: '#1877F2', href: `https://www.facebook.com/sharer/sharer.php?u=${enc(link)}` },
    { name: 'X', icon: 'x', color: '#1a1a1a', href: `https://twitter.com/intent/tweet?text=${enc(shareText)}&url=${enc(link)}` },
    { name: 'Email', icon: 'email', color: '#a37b2e', href: `mailto:?subject=${enc('Legacy Fan Club')}&body=${enc(`${shareText}\n${link}`)}` },
  ];

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  }

  return (
    <div className="mt-3">
      {/* Compartir nativo (móvil): abre la hoja del sistema con todas las apps. */}
      {canNative ? (
        <button
          type="button"
          onClick={nativeShare}
          className="mb-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-gold px-5 text-sm font-semibold uppercase tracking-[0.14em] text-[#1a1408] transition hover:brightness-105 sm:w-auto"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
          </svg>
          {nativeLabel}
        </button>
      ) : null}

      <div className="flex flex-wrap items-center gap-2.5">
        {nets.map((n) => (
          <a
            key={n.name}
            href={n.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={n.name}
            title={n.name}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white shadow-card transition hover:scale-110"
            style={{ backgroundColor: n.color }}
          >
            <Icon name={n.icon} />
          </a>
        ))}

        {/* Copiar enlace */}
        <button
          type="button"
          onClick={copy}
          className="inline-flex h-10 items-center gap-1.5 rounded-full border border-gold/50 bg-gold/10 px-4 text-sm font-medium text-gold-light transition hover:bg-gold/20"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden>
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          {copied ? copiedLabel : copyLabel}
        </button>
      </div>
    </div>
  );
}
