// Pilares de valor con numeración romana Art Deco y filete (sin dígitos dorados flotantes).
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];

export function ValuePillars({
  eyebrow,
  pillars,
}: {
  eyebrow: string;
  pillars: { n: string; title: string; body: string }[];
}) {
  return (
    <section className="mt-16">
      <p className="eyebrow">{eyebrow}</p>
      <div className="mt-6 grid grid-cols-1 gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {pillars.map((p, i) => (
          <article key={p.title} className="bg-surface p-6">
            <div className="flex items-baseline gap-3">
              <span className="font-display text-xl text-gold">{ROMAN[i] ?? p.n}</span>
              <span className="h-px flex-1 bg-border" />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold uppercase tracking-wide text-foreground">
              {p.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{p.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
