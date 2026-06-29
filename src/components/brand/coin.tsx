// Moneda metálica (réplica exacta del coin del Hero A del prototipo).
// Plata .999 por defecto; placeholder de producto hasta tener foto real.
export function Coin({
  label = 'PRODUCT SHOT · 2oz',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={`relative aspect-square max-w-full ${className ?? 'w-[380px]'}`}>
      <div
        className="relative h-full w-full rounded-full"
        style={{
          background:
            'radial-gradient(circle at 36% 28%, #fbfaf6, #cfd2d8 30%, #8d9095 58%, #46474b 82%, #26272a)',
          boxShadow:
            '0 40px 90px -20px rgba(0,0,0,0.8), inset 0 0 60px rgba(255,255,255,0.12)',
        }}
      >
        {/* Filo interior */}
        <div
          className="absolute rounded-full"
          style={{ inset: '26px', border: '2px solid rgba(255,255,255,0.16)' }}
        />
        {/* Etiqueta de producto (placeholder) */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            fontFamily: 'monospace',
            fontSize: '11px',
            letterSpacing: '0.1em',
            color: 'rgba(40,40,44,0.7)',
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}
