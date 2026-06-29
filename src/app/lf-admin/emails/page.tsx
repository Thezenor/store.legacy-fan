import { prisma } from '@/lib/prisma';
import { updateEmailTemplateAction, sendTestEmailAction } from '@/lib/admin-actions';

// Gestor de plantillas de email (doc 09/10): editar asunto/cuerpo por idioma,
// activar/desactivar y enviar test. Variables disponibles: {{firstName}}, {{amount}},
// {{memberNumber}}, {{deadline}}.
export default async function AdminEmails() {
  const templates = await prisma.emailTemplate.findMany({
    include: { translations: { orderBy: { locale: 'asc' } } },
    orderBy: { key: 'asc' },
  });

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-foreground">Emails</h1>
      <p className="mt-1 text-sm text-muted">
        Variables: <code className="text-gold-light">{'{{firstName}} {{amount}} {{memberNumber}} {{deadline}}'}</code>
      </p>

      <div className="mt-6 space-y-6">
        {templates.map((tpl) => (
          <div key={tpl.id} className="rounded-card border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm text-gold-light">{tpl.key}</span>
              <form action={sendTestEmailAction}>
                <input type="hidden" name="key" value={tpl.key} />
                <input type="hidden" name="locale" value="es" />
                <button type="submit" className="rounded border border-border px-3 py-1.5 text-xs text-muted hover:text-foreground">
                  Enviar test (ES)
                </button>
              </form>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {tpl.translations.map((tr) => (
                <form key={tr.id} action={updateEmailTemplateAction} className="rounded border border-border p-3">
                  <input type="hidden" name="templateId" value={tpl.id} />
                  <input type="hidden" name="locale" value={tr.locale} />
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-faint">{tr.locale}</span>
                    <label className="flex items-center gap-2 text-xs text-muted">
                      <input type="checkbox" name="active" defaultChecked={tpl.active} /> Activa
                    </label>
                  </div>
                  <input name="subject" defaultValue={tr.subject} className="mt-2 w-full rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground" />
                  <textarea name="body" defaultValue={tr.body} rows={3} className="mt-2 w-full rounded border border-border bg-background px-2 py-1.5 text-sm text-muted" />
                  <button type="submit" className="mt-2 rounded border border-gold/40 px-3 py-1.5 text-xs uppercase tracking-wider text-gold-light hover:bg-surface-elevated">
                    Guardar
                  </button>
                </form>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
