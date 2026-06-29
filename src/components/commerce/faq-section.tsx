// Sección FAQ (acordeón nativo <details>). Contenido i18n; migrará a FaqItem (BD) en Módulo 10.
export function FaqSection({
  title,
  items,
}: {
  title: string;
  items: { q: string; a: string }[];
}) {
  return (
    <section className="mt-12">
      <h2 className="font-display text-2xl font-bold text-foreground">{title}</h2>
      <div className="mt-4 space-y-2">
        {items.map((it) => (
          <details
            key={it.q}
            className="rounded-card border border-border bg-surface p-4 [&_summary]:cursor-pointer"
          >
            <summary className="font-medium text-foreground">{it.q}</summary>
            <p className="mt-2 text-sm text-muted">{it.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
