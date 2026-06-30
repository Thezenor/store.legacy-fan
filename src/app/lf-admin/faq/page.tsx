import { prisma } from '@/lib/prisma';
import { upsertFaqAction, deleteFaqAction } from '@/lib/admin-actions';

const inp = 'rounded border border-border bg-background px-2 py-1.5 text-foreground';

export default async function AdminFaq() {
  const items = await prisma.faqItem.findMany({ orderBy: [{ locale: 'asc' }, { sortOrder: 'asc' }] });

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl font-bold text-foreground">FAQ</h1>
      <p className="mt-1 text-sm text-muted">Preguntas frecuentes (alimentan el schema FAQPage).</p>

      {/* Crear */}
      <form action={upsertFaqAction} className="mt-4 space-y-2 rounded-card border border-border bg-surface p-4">
        <div className="flex gap-3">
          <select name="locale" className={inp} defaultValue="es">
            {['es', 'en', 'fr', 'it'].map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <input name="question" placeholder="Pregunta" required className={`flex-1 ${inp}`} />
        </div>
        <textarea name="answer" placeholder="Respuesta" rows={2} className={`w-full ${inp}`} />
        <button type="submit" className="bevel bg-gold px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#1a1408]">Añadir</button>
      </form>

      <div className="mt-6 space-y-2">
        {items.map((it) => (
          <form key={it.id} action={upsertFaqAction} className="rounded-card border border-border bg-surface p-3">
            <input type="hidden" name="id" value={it.id} />
            <input type="hidden" name="locale" value={it.locale} />
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase text-faint">{it.locale}</span>
              <input name="question" defaultValue={it.question} className={`flex-1 ${inp}`} />
            </div>
            <textarea name="answer" defaultValue={it.answer} rows={2} className={`mt-2 w-full ${inp}`} />
            <div className="mt-2 flex gap-2">
              <button type="submit" className="border border-gold/40 px-3 py-1.5 text-xs uppercase tracking-wider text-gold-light hover:bg-surface-elevated">Guardar</button>
              <button type="submit" formAction={deleteFaqAction} className="border border-red-500/40 px-3 py-1.5 text-xs uppercase tracking-wider text-red-400 hover:bg-surface-elevated">Borrar</button>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}
