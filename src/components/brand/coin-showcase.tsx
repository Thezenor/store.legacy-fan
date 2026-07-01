'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Efecto de moneda premium replicado del hero de legacy-fan.com:
 *  - Flotación con leve balanceo (CSS `coinFloat`).
 *  - Halo dorado con drop-shadows apilados (sigue la forma de la moneda) que
 *    se intensifica al pasar el ratón.
 *  - Inclinación 3D siguiendo el puntero, suavizada con requestAnimationFrame +
 *    interpolación (lerp) aplicada DIRECTAMENTE al DOM (sin re-render de React),
 *    por eso es fluida a 60fps y no da tirones.
 * En táctil/sin ratón fino no se aplica el tilt (solo flotación + halo).
 */
export function CoinShowcase({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const tiltRef = useRef<HTMLDivElement>(null);
  const s = useRef({ curX: 0, curY: 0, tgtX: 0, tgtY: 0, hovering: false, raf: 0 });

  useEffect(() => {
    const el = tiltRef.current;
    if (!el) return;
    // Solo tilt con puntero fino (ratón); en táctil se queda plano.
    const fine = window.matchMedia('(pointer: fine)').matches;
    if (!fine) return;
    const st = s.current;
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    function tick() {
      st.curX = lerp(st.curX, st.tgtX, 0.12);
      st.curY = lerp(st.curY, st.tgtY, 0.12);
      el!.style.transform = `perspective(700px) rotateY(${st.curX.toFixed(2)}deg) rotateX(${st.curY.toFixed(2)}deg)`;
      const settled = !st.hovering && Math.abs(st.curX) < 0.05 && Math.abs(st.curY) < 0.05;
      if (settled) {
        el!.style.transform = '';
        st.raf = 0;
        return;
      }
      st.raf = requestAnimationFrame(tick);
    }
    function ensure() {
      if (!st.raf) st.raf = requestAnimationFrame(tick);
    }
    function onMove(e: PointerEvent) {
      const r = el!.getBoundingClientRect();
      st.tgtX = ((e.clientX - r.left) / r.width - 0.5) * 22; // rotateY
      st.tgtY = -((e.clientY - r.top) / r.height - 0.5) * 18; // rotateX
      ensure();
    }
    function onEnter() {
      st.hovering = true;
      ensure();
    }
    function onLeave() {
      st.hovering = false;
      st.tgtX = 0;
      st.tgtY = 0;
      ensure();
    }

    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      if (st.raf) cancelAnimationFrame(st.raf);
    };
  }, []);

  return (
    <div className={`coin3d ${className ?? ''}`}>
      <div ref={tiltRef} className="coin3d-tilt">
        <div className="coin3d-glow">
          <div className="coin3d-float">{children}</div>
        </div>
      </div>
    </div>
  );
}
