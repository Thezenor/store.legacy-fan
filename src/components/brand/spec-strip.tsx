// Cartela de especificación estática (reemplaza la marquesina/banner corriendo).
// Lee como el pie de una lámina numismática: datos técnicos entre filetes, sin movimiento.
export function SpecStrip({ items }: { items: string[] }) {
  return (
    <div className="py-5">
      <div className="hairline-gold" />
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 py-4 sm:gap-x-8">
        {items.map((it, i) => (
          <span key={it} className="flex items-center gap-x-5 sm:gap-x-8">
            {i > 0 ? <span className="text-gold/50" aria-hidden>✦</span> : null}
            <span className="serial text-xs sm:text-sm">{it}</span>
          </span>
        ))}
      </div>
      <div className="hairline-gold" />
    </div>
  );
}
