// Wordmark Legacy Fan (réplica del logo del diseño):
// "LEGACY FAN" en Cormorant + filete dorado + "PRECIOUS METALS" en versales finas.
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={`inline-flex flex-col items-center leading-none ${className ?? ''}`}>
      <span className="font-display font-semibold tracking-[0.12em] text-foreground text-[17px] sm:text-[21px] sm:tracking-[0.18em]">
        LEGACY FAN
      </span>
      <span
        aria-hidden="true"
        className="my-1 h-px w-full"
        style={{ background: 'linear-gradient(90deg, transparent, #c8a24b 20%, #c8a24b 80%, transparent)' }}
      />
      <span
        className="font-sans"
        style={{ fontSize: '8px', letterSpacing: '0.42em', color: '#c8a24b' }}
      >
        PRECIOUS METALS
      </span>
    </span>
  );
}
