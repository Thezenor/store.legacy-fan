import { ArtDecoMotif } from './art-deco-motif';

// Carnet digital del socio (réplica del carnet físico Art Deco).
// `active=false` muestra una vista atenuada para reservas pendientes.
export function DigitalMemberCard({
  name,
  number,
  active = true,
  pendingLabel,
}: {
  name: string;
  number: string;
  active?: boolean;
  pendingLabel?: string;
}) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-gold/30 bg-[#08080a] shadow-card"
      style={{ aspectRatio: '1.586' }}
    >
      {/* Motivo Art Deco como fondo */}
      <ArtDecoMotif className="pointer-events-none absolute -left-10 bottom-0 h-full opacity-70" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#08080a]/40 to-[#08080a]/85" />

      {/* Marco fino dorado interior */}
      <div className="absolute inset-3 rounded-xl border border-gold/20" />

      <div className={`relative flex h-full flex-col justify-between p-5 sm:p-7 ${active ? '' : 'opacity-60'}`}>
        <p className="eyebrow">Legacy Fan Club · Member Card</p>
        <div className="text-right">
          <p className="font-display text-lg text-foreground sm:text-2xl">{name}</p>
          <p className="font-display text-2xl font-semibold text-metal-gold sm:text-4xl">
            Nº {number}
          </p>
        </div>
        <p className="text-[10px] tracking-wide text-faint">
          legacyfan.es © Legacy Fan Precious Metals LLC
        </p>
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
