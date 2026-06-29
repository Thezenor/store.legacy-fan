// Emblema Art Deco inspirado en el carnet Legacy Fan Club:
// arco solar dorado, cuñas en plata/cobre/oro y filos finos.
// Decorativo (aria-hidden); escala con el contenedor.
export function ArtDecoMotif({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      aria-hidden="true"
      role="presentation"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="lf-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f4efe2" />
          <stop offset="45%" stopColor="#e6c878" />
          <stop offset="75%" stopColor="#c6a253" />
          <stop offset="100%" stopColor="#a9822f" />
        </linearGradient>
        <linearGradient id="lf-silver" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fbfaf6" />
          <stop offset="50%" stopColor="#cfd2d8" />
          <stop offset="100%" stopColor="#8d9095" />
        </linearGradient>
        <linearGradient id="lf-copper" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e8c4a8" />
          <stop offset="50%" stopColor="#c0855a" />
          <stop offset="100%" stopColor="#7c4f33" />
        </linearGradient>
      </defs>

      {/* Marco fino dorado (esquinas Art Deco) */}
      <path d="M14 40 V14 H40" fill="none" stroke="url(#lf-gold)" strokeWidth="1.5" opacity="0.8" />
      <path d="M386 360 V386 H360" fill="none" stroke="url(#lf-gold)" strokeWidth="1.5" opacity="0.8" />

      {/* Cuñas metálicas que ascienden (abanico) */}
      <polygon points="40,360 150,360 70,180" fill="url(#lf-copper)" opacity="0.92" />
      <polygon points="120,360 250,360 200,150" fill="url(#lf-silver)" opacity="0.9" />
      <polygon points="220,360 340,360 320,210" fill="url(#lf-gold)" opacity="0.85" />

      {/* Arco solar (círculo recortado) */}
      <circle cx="250" cy="200" r="150" fill="none" stroke="url(#lf-gold)" strokeWidth="2.5" />
      <path
        d="M250 50 A150 150 0 0 1 400 200"
        fill="none"
        stroke="url(#lf-gold)"
        strokeWidth="6"
        opacity="0.9"
      />

      {/* Filo horizontal */}
      <line x1="40" y1="300" x2="360" y2="300" stroke="url(#lf-gold)" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}
