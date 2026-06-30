import { Link } from '@/i18n/navigation';
import type { ClubPricing } from '@/lib/commerce';

// Tarjeta de plan para la comparativa: reserva destacada, PVP tachado + precio
// actual, un único botón "Reservar". Sin referencias a "Fases" (doc usuario).
export function PlanCard({
  title,
  tagline,
  pricing,
  reservationFormatted,
  includes,
  labels,
  accent,
  featured,
}: {
  title: string;
  tagline: string;
  pricing: ClubPricing;
  reservationFormatted: string;
  includes: string[];
  labels: {
    from: string;
    reserveFrom: string;
    fullPrice: string;
    includesTitle: string;
    reserve: string;
  };
  accent: 'silver' | 'gold';
  featured?: boolean;
}) {
  const club = pricing.club;
  const ring = accent === 'gold' ? 'border-gold/50' : 'border-silver/40';
  const titleColor = accent === 'gold' ? 'text-gold' : 'text-silver';
  const markColor = accent === 'gold' ? 'bg-gold' : 'bg-silver';

  return (
    <article
      className={`bevel flex flex-col border ${ring} bg-surface p-6 shadow-card transition hover:border-gold/60 animate-fade-in ${
        featured ? 'ring-1 ring-gold/30' : ''
      }`}
    >
      <h2 className={`font-display text-2xl font-bold ${titleColor}`}>{title}</h2>
      <p className="mt-2 text-sm font-medium text-foreground">{tagline}</p>

      <div className="mt-4">
        {/* Reserva: el foco principal */}
        <p className="eyebrow text-gold-light">{labels.reserveFrom}</p>
        <p className="mt-1 font-display text-3xl font-bold tabular-nums text-metal-gold sm:text-4xl">
          {reservationFormatted}
        </p>
        {/* Pago completo secundario, con PVP tachado */}
        <p className="mt-2 flex items-baseline gap-2 text-sm">
          <span className="text-xs uppercase tracking-wider text-faint">{labels.fullPrice}:</span>
          {pricing.listPriceFormatted ? (
            <span className="text-faint line-through">{pricing.listPriceFormatted}</span>
          ) : null}
          <span className="font-semibold tabular-nums text-foreground">{pricing.priceFormatted}</span>
        </p>
      </div>

      <h3 className="mt-5 text-sm font-semibold text-foreground">{labels.includesTitle}</h3>
      <ul className="mt-2 flex-1 space-y-1.5 text-sm text-muted">
        {includes.map((item) => (
          <li key={item} className="flex items-baseline gap-3">
            <span className={`mt-2 h-px w-3 shrink-0 ${markColor}`} aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <Link
          href={`/checkout?club=${club}`}
          className="bevel block bg-gold px-5 py-3 text-center text-xs font-semibold uppercase tracking-[0.16em] text-[#1a1408] transition hover:bg-gold-light"
        >
          {labels.reserve}
        </Link>
      </div>
    </article>
  );
}
