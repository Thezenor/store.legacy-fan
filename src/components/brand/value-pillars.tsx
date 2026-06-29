// Pilares de valor (manual de marca): 3 cards con número, título y cuerpo.
export function ValuePillars({
  eyebrow,
  pillars,
}: {
  eyebrow: string;
  pillars: { n: string; title: string; body: string }[];
}) {
  return (
    <section className="mt-16">
      <p className="eyebrow text-center">{eyebrow}</p>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pillars.map((p) => (
          <article
            key={p.n}
            className="rounded-card border border-border bg-surface p-6 transition hover:border-gold/40"
          >
            <span className="font-display text-2xl text-gold">{p.n}</span>
            <h3 className="mt-3 font-display text-xl font-semibold text-foreground">{p.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{p.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
