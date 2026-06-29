// Marquesina infinita de marca (CSS puro, sin JS). Duplica el texto para bucle continuo.
export function Marquee({ text }: { text: string }) {
  return (
    <div className="overflow-hidden border-y border-border py-3">
      <div className="lf-marquee">
        {[0, 1].map((i) => (
          <span
            key={i}
            aria-hidden={i === 1}
            className="px-6 text-[11px] uppercase tracking-[0.3em] text-faint"
          >
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}
