// Carnet digital del socio: usa las imágenes reales del carnet físico Art Deco
// (anverso = portada "LEGACY FAN CLUB"; reverso = lado del socio con el motivo
// metálico) y superpone el nombre y el número reales sobre el reverso.
// El tamaño del texto escala con el ancho de la tarjeta (container queries),
// para que se vea igual en móvil y escritorio.

const GOLD = '#c6a04e';

// Imágenes del carnet. Variante -sm (620px, ligera) para móvil y la grande
// (1000px) para escritorio/retina; el navegador elige con srcSet/sizes.
const SRC = {
  front: { lg: '/brand/legacy-card-front.webp', sm: '/brand/legacy-card-front-sm.webp' },
  back: { lg: '/brand/legacy-card-back.webp', sm: '/brand/legacy-card-back-sm.webp' },
};

export function DigitalMemberCard({
  name,
  number,
  side = 'front',
  active = true,
  pendingLabel,
  qrDataUri,
}: {
  name: string;
  number: string;
  side?: 'front' | 'back';
  active?: boolean;
  pendingLabel?: string;
  /** QR firmado (data URI SVG) para el reverso; solo si el sistema está activo. */
  qrDataUri?: string;
}) {
  const isBack = side === 'back';
  const img = isBack ? SRC.back : SRC.front;
  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl bg-[#0c0c0e] shadow-card"
      style={{ aspectRatio: '1579 / 996', containerType: 'inline-size' }}
    >
      {/* Imagen real del carnet (responsive: ligera en móvil) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={img.lg}
        srcSet={`${img.sm} 620w, ${img.lg} 1000w`}
        sizes="(min-width: 640px) 340px, 92vw"
        alt={isBack ? `Carnet de socio ${number}` : 'Legacy Fan Club'}
        className={`absolute inset-0 h-full w-full scale-[1.02] object-cover ${active ? '' : 'opacity-50'}`}
        loading="lazy"
        decoding="async"
        draggable={false}
      />

      {/* Reverso: nombre + número + leyenda + footer (texto vivo, en oro). */}
      {isBack && active ? (
        <>
          {/* Solo nombre + número, centrados en el panel oscuro (encima del
              footer, que ya viene horneado en la imagen). */}
          <div
            className="absolute flex flex-col items-center text-center"
            style={{ left: '37%', right: '3%', top: '46%', transform: 'translateY(-50%)', color: GOLD }}
          >
            {name ? (
              <span
                className="block max-w-full truncate font-sans"
                style={{ fontSize: '4.7cqw', lineHeight: 1.1 }}
              >
                {name}
              </span>
            ) : null}
            <span
              className="font-sans font-semibold"
              style={{ fontSize: '6.7cqw', lineHeight: 1.15, marginTop: '2.6cqw', letterSpacing: '0.01em' }}
            >
              <span style={{ fontSize: '3.6cqw', verticalAlign: '0.95em', marginRight: '0.25em' }}>Nº</span>
              {number}
            </span>
          </div>

          {/* QR firmado (solo si el sistema de carnet está activo) */}
          {qrDataUri ? (
            <div
              className="absolute rounded-md bg-white shadow-card"
              style={{ top: '7%', right: '5%', width: '14%', padding: '1%' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUri} alt={`QR socio ${number}`} className="h-full w-full" />
            </div>
          ) : null}
        </>
      ) : null}

      {/* Estado pendiente (reserva sin pago completo) */}
      {!active && pendingLabel ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="rounded-full border border-gold/40 bg-background/70 px-4 py-1.5 text-xs uppercase tracking-wider text-gold-light backdrop-blur">
            {pendingLabel}
          </span>
        </div>
      ) : null}
    </div>
  );
}
