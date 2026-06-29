import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

// Landing del Legacy Fan Club + comparativa de planes (se ampliará en Fase 1).
export default async function ClubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const prime = await getTranslations({ locale, namespace: 'prime' });
  const prestige = await getTranslations({ locale, namespace: 'prestige' });

  return (
    <section className="grid gap-6 sm:grid-cols-2">
      <PlanCard
        title={prime('title')}
        tagline={prime('tagline')}
        body={prime('body')}
        ctaLabel={prime('ctaReserve')}
        href="/club/prime"
        accent="silver"
      />
      <PlanCard
        title={prestige('title')}
        tagline={prestige('tagline')}
        body={prestige('body')}
        ctaLabel={prestige('ctaReserve')}
        href="/club/prestige"
        accent="gold"
      />
    </section>
  );
}

function PlanCard({
  title,
  tagline,
  body,
  ctaLabel,
  href,
  accent,
}: {
  title: string;
  tagline: string;
  body: string;
  ctaLabel: string;
  href: '/club/prime' | '/club/prestige';
  accent: 'silver' | 'gold';
}) {
  const ring = accent === 'gold' ? 'border-gold/50' : 'border-silver/40';
  const titleColor = accent === 'gold' ? 'text-gold' : 'text-silver';
  return (
    <article
      className={`flex flex-col rounded-card border ${ring} bg-surface p-6 shadow-card animate-fade-in`}
    >
      <h2 className={`font-display text-2xl font-bold ${titleColor}`}>{title}</h2>
      <p className="mt-2 text-sm font-medium text-foreground">{tagline}</p>
      <p className="mt-3 flex-1 text-sm text-muted">{body}</p>
      <Link
        href={href}
        className="mt-6 rounded-card bg-foreground px-5 py-3 text-center font-semibold text-background transition hover:opacity-90"
      >
        {ctaLabel}
      </Link>
    </article>
  );
}
