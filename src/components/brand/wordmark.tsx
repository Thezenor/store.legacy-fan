// Wordmark Legacy Fan: sello metálico + "LEGACY FAN" en Cormorant, tracking 0.16em.
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ''}`}>
      <span
        aria-hidden="true"
        className="h-7 w-7 shrink-0 rounded-full"
        style={{
          background: 'radial-gradient(circle at 35% 30%, #fbfaf6, #cfd2d8 45%, #8d9095 100%)',
          boxShadow: 'inset 0 0 6px rgba(0,0,0,0.35)',
        }}
      />
      <span
        className="font-display text-lg font-semibold text-foreground"
        style={{ letterSpacing: '0.16em' }}
      >
        LEGACY FAN
      </span>
    </span>
  );
}
