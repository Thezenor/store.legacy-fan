// Renderiza datos estructurados schema.org (doc 11). Server component.
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // El contenido es generado por nosotros (no input de usuario).
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
