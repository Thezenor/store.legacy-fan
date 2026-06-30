import { ArtDecoMotif } from './art-deco-motif';

// Carnet digital del socio (réplica del carnet físico Art Deco): anverso con
// número y nombre, y reverso. `active=false` atenúa (reservas pendientes).
export function DigitalMemberCard({
  name,
  number,
  side = 'front',
  active = true,
  pendingLabel,
}: {
  name: string;
  number: string;
  side?: 'front' | 'back';
  active?: boolean;
  pendingLabel?: string;
}) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-gold/30 bg-[#0a0a0c] shadow-card"
      style={{ aspectRatio: '1.586' }}
    >
      {/* Motivo Art Deco (cuñas oro/plata/cobre + arco) en la esquina izquierda */}
      <ArtDecoMotif className="pointer-events-none absolute -left-[12%] bottom-0 h-full opacity-90" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0c]/10 via-[#0a0a0c]/55 to-[#0a0a0c]/92" />

      {/* Filos dorados (marco fino + líneas Art Deco como en el carnet) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-[7%] top-[8%] h-[84%] w-px bg-gold/30" />
        <div className="absolute left-[40%] right-0 top-[64%] h-px bg-gold/25" />
      </div>

      <div className={`relative flex h-full flex-col p-5 sm:p-7 ${active ? '' : 'opacity-60'}`}>
        {side === 'front' ? (
          <>
            <div className="mt-auto text-right">
              {name ? (
                <p className="truncate font-display text-sm uppercase tracking-[0.12em] text-foreground/90 sm:text-base">
                  {name}
                </p>
              ) : null}
              <p className="font-display text-3xl font-semibold tracking-wide text-metal-gold sm:text-5xl">
                <span className="align-super text-base sm:text-2xl">Nº</span> {number}
              </p>
              <p className="mt-1 font-display text-[11px] uppercase tracking-[0.22em] text-gold-light sm:text-sm">
                Legacy Fan Club · Member Card
              </p>
            </div>
            <p className="mt-auto text-right text-[9px] leading-relaxed tracking-wide text-gold-light/70 sm:text-[11px]">
              Legacy-fan.com
              <br />© Legacy Fan Precious Metals LLC.
            </p>
          </>
        ) : (
          <>
            <p className="ml-auto mt-auto max-w-[55%] text-right text-[9px] leading-relaxed tracking-wide text-gold-light/70 sm:text-[11px]">
              Legacy-fan.com
              <br />© Legacy Fan Precious Metals LLC.
            </p>
          </>
        )}
      </div>

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
