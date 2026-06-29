// Marquesina infinita de marca (réplica del prototipo): Cormorant 17px,
// tracking 0.2em, color #7e7b73, fondo #0b0b0d, 28s linear. CSS puro.
export function Marquee({ text }: { text: string }) {
  return (
    <div
      className="overflow-hidden py-3.5"
      style={{
        background: '#0b0b0d',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div
        className="lf-marquee font-display"
        style={{ fontSize: '17px', letterSpacing: '0.2em', color: '#7e7b73' }}
      >
        {[0, 1].map((i) => (
          <span key={i} aria-hidden={i === 1} className="whitespace-nowrap px-6">
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}
