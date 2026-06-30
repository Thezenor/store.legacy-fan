import Link from 'next/link';
import { renderTemplate } from '@/lib/email/templates';

// Previsualización del email tal como lo recibiría el cliente.
const SAMPLE = { firstName: 'María', amount: '50,00 €', memberNumber: 'LF-000123', deadline: '31/12/2026' };

export default async function EmailPreview({
  params,
  searchParams,
}: {
  params: Promise<{ key: string }>;
  searchParams: Promise<{ locale?: string }>;
}) {
  const { key } = await params;
  const { locale } = await searchParams;
  const loc = (locale === 'en' || locale === 'fr' || locale === 'it' ? locale : 'es') as
    | 'es' | 'en' | 'fr' | 'it';
  const rendered = await renderTemplate(key, loc, SAMPLE);

  return (
    <div className="max-w-2xl">
      <Link href="/lf-admin/emails" className="text-sm text-muted hover:text-foreground">← Emails</Link>
      <h1 className="mt-2 font-display text-2xl font-bold text-foreground">Vista previa · {key}</h1>
      <div className="mt-2 flex gap-2 text-xs">
        {['es', 'en', 'fr', 'it'].map((l) => (
          <Link key={l} href={`?locale=${l}`} className={`rounded border px-2 py-1 uppercase ${l === loc ? 'border-gold text-gold-light' : 'border-border text-muted'}`}>{l}</Link>
        ))}
      </div>

      {rendered ? (
        <>
          <p className="mt-4 text-sm text-muted">Asunto: <span className="text-foreground">{rendered.subject}</span></p>
          {/* Render del email en un lienzo claro, como lo vería el cliente */}
          <div className="mt-3 overflow-hidden rounded-card border border-border bg-white p-6">
            <div dangerouslySetInnerHTML={{ __html: rendered.html }} />
          </div>
        </>
      ) : (
        <p className="mt-4 text-sm text-red-400">Plantilla no encontrada o inactiva.</p>
      )}
    </div>
  );
}
