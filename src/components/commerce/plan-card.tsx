import { Link } from '@/i18n/navigation';
import type { ClubPricing } from '@/lib/commerce';

// Tarjeta de plan para la comparativa (doc 12: tarjetas elegantes, jerarquía clara).
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
    currentPhase: string;
    reservation: string;
    includesTitle: string;
    reserve: string;
    join: string;
  };
  accent: 'silver' | 'gold';
  featured?: boolean;
}) {
  const club = pricing.club;
  const ring = accent === 'gold' ? 'border-gold/50' : 'border-silver/40';
  const titleColor = accent === 'gold' ? 'text-gold' : 'text-silver';

  return (
    <article
      className={`flex flex-col rounded-card border ${ring} bg-surface p-6 shadow-card transition hover:border-gold/60 animate-fade-in ${
        featured ? 'ring-1 ring-gold/30' : ''
      }`}
    >
      <h2 className={`font-display text-2xl font-bold ${titleColor}`}>{title}</h2>
      <p className="mt-2 text-sm font-medium text-foreground">{tagline}</p>

      <div className="mt-4">
        <p className="eyebrow">
          {labels.currentPhase} · {pricing.phaseName}
        </p>
        <p className="mt-2">
          <span className="text-sm text-muted">{labels.from} </span>
          <span className="font-display text-3xl font-semibold text-metal-gold sm:text-4xl">
            {pricing.priceFormatted}
          </span>
        </p>
        <p className="mt-1 text-sm text-muted">
          {labels.reservation}: <span className="text-gold-light">{reservationFormatted}</span>
        </p>
      </div>

      <h3 className="mt-5 text-sm font-semibold text-foreground">{labels.includesTitle}</h3>
      <ul className="mt-2 flex-1 space-y-1.5 text-sm text-muted">
        {includes.map((item) => (
          <li key={item} className="flex gap-2">
            <span className={accent === 'gold' ? 'text-gold' : 'text-silver'}>✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-col gap-2">
        <Link
          href={`/checkout?club=${club}&type=join`}
          className="rounded bg-gold-grad px-5 py-3 text-center text-sm font-semibold uppercase tracking-wider text-[#160f02] transition hover:brightness-110"
        >
          {labels.join}
        </Link>
        <Link
          href={`/checkout?club=${club}&type=reserve`}
          className="rounded border border-gold/40 px-5 py-3 text-center text-sm font-medium uppercase tracking-wider text-gold-light transition hover:bg-surface-elevated"
        >
          {labels.reserve}
        </Link>
      </div>
    </article>
  );
}
