// Moneda acuñada (no un degradado 3D genérico): canto estriado, leyenda circular
// tipográfica, monograma y número de serie grabado. Mate, no espejo.
// Placeholder hasta tener foto real del producto.
type Metal = 'silver' | 'gold' | 'copper';

const METALS: Record<Metal, { a: string; b: string; c: string }> = {
  silver: { a: '#e7e9ec', b: '#b8bcc2', c: '#83868c' },
  gold: { a: '#f0dca0', b: '#caa84f', c: '#8a6a26' },
  copper: { a: '#e2b893', b: '#c0855a', c: '#7c4f33' },
};

export function Coin({
  serial = 'LF · 0001',
  legend = 'LEGACY FAN CLUB · .999 FINE SILVER',
  metal = 'silver',
  className,
}: {
  serial?: string;
  legend?: string;
  metal?: Metal;
  className?: string;
}) {
  const m = METALS[metal];
  const repeated = `${legend} · ${legend} · `;

  return (
    <div className={`aspect-square max-w-full ${className ?? 'w-[360px]'}`}>
      <svg viewBox="0 0 400 400" className="h-full w-full" role="img" aria-label={`Moneda ${serial}`}>
        <defs>
          <radialGradient id="coin-field" cx="42%" cy="40%" r="65%">
            <stop offset="0%" stopColor={m.a} />
            <stop offset="60%" stopColor={m.b} />
            <stop offset="100%" stopColor={m.c} />
          </radialGradient>
          <path id="coin-legend" d="M200,200 m-150,0 a150,150 0 1,1 300,0 a150,150 0 1,1 -300,0" />
        </defs>

        {/* Canto estriado (milled edge): aro con guiones radiales */}
        <circle cx="200" cy="200" r="194" fill="none" stroke={m.c} strokeWidth="12" />
        <circle
          cx="200"
          cy="200"
          r="194"
          fill="none"
          stroke={m.a}
          strokeWidth="12"
          strokeDasharray="2 4"
          opacity="0.5"
        />

        {/* Campo de la moneda */}
        <circle cx="200" cy="200" r="184" fill="url(#coin-field)" />
        {/* Filos / rebordes grabados */}
        <circle cx="200" cy="200" r="172" fill="none" stroke="#000" strokeOpacity="0.18" strokeWidth="1.5" />
        <circle cx="200" cy="200" r="170" fill="none" stroke="#fff" strokeOpacity="0.16" strokeWidth="1" />
        <circle cx="200" cy="200" r="120" fill="none" stroke="#000" strokeOpacity="0.14" strokeWidth="1" />

        {/* Leyenda circular */}
        <text
          fill="#1d1d1f"
          fillOpacity="0.72"
          style={{ fontFamily: 'var(--font-display)', fontSize: '15px', letterSpacing: '0.12em' }}
        >
          <textPath href="#coin-legend" startOffset="0">
            {repeated}
          </textPath>
        </text>

        {/* Monograma central grabado */}
        <text
          x="200"
          y="196"
          textAnchor="middle"
          fill="#1d1d1f"
          fillOpacity="0.8"
          style={{ fontFamily: 'var(--font-display)', fontSize: '64px', fontWeight: 700, letterSpacing: '0.04em' }}
        >
          LF
        </text>
        {/* Estrella Deco */}
        <text x="200" y="150" textAnchor="middle" fill="#1d1d1f" fillOpacity="0.5" style={{ fontSize: '18px' }}>
          ✦
        </text>
        {/* Serial + año */}
        <text
          x="200"
          y="232"
          textAnchor="middle"
          fill="#1d1d1f"
          fillOpacity="0.7"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.18em' }}
        >
          {serial} · MMXXVI
        </text>
      </svg>
    </div>
  );
}
