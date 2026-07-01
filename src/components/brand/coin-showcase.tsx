'use client';

import { useRef, useState, type ReactNode } from 'react';

/**
 * Realza una moneda/imagen circular con un efecto premium y fluido:
 *  - Inclinación 3D que sigue al puntero (perspectiva + rotateX/Y).
 *  - Destello de luz que se mueve con el puntero.
 *  - Flotación suave en reposo + halo dorado detrás.
 * Solo anima `transform`/`opacity` (compuesto por GPU → 60fps, sin tirones).
 */
export function CoinShowcase({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50 });
  const [active, setActive] = useState(false);

  function onMove(e: React.PointerEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width; // 0..1
    const py = (e.clientY - r.top) / r.height; // 0..1
    const MAX = 11; // grados
    setTilt({
      rx: (0.5 - py) * 2 * MAX,
      ry: (px - 0.5) * 2 * MAX,
      gx: px * 100,
      gy: py * 100,
    });
  }

  function onLeave() {
    setActive(false);
    setTilt({ rx: 0, ry: 0, gx: 50, gy: 50 });
  }

  return (
    <div
      ref={ref}
      className={`coin3d ${className ?? ''}`}
      onPointerEnter={() => setActive(true)}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <div className="coin3d-float" data-active={active}>
        <div
          className="coin3d-tilt"
          style={{ transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)` }}
        >
          {children}
          <span
            className="coin3d-glare"
            style={{
              opacity: active ? 1 : 0,
              background: `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(255,248,225,0.45), rgba(255,255,255,0) 45%)`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
