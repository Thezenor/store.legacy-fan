import { prisma } from '../prisma';
import { getEmailProvider } from './index';

type Locale = 'es' | 'en' | 'fr' | 'it';

/** Interpola {{var}} con los valores dados (escapando HTML básico). */
function interpolate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => {
    const v = vars[k] ?? '';
    return String(v).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c]!);
  });
}

function shell(bodyHtml: string): string {
  return `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;color:#16161a">
    <h1 style="color:#9C7E1C;font-size:20px">Legacy Fan</h1>
    <div style="font-size:15px;line-height:1.6">${bodyHtml}</div>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
    <p style="font-size:12px;color:#888">Los productos Legacy Fan son artículos coleccionables. No constituyen producto financiero ni promesa de rentabilidad futura.</p>
  </div>`;
}

/**
 * Renderiza una plantilla de email de la BD (gestionada desde superadmin).
 * Fallback de idioma a ES. Devuelve null si la plantilla no existe o está inactiva.
 */
export async function renderTemplate(
  key: string,
  locale: Locale,
  vars: Record<string, string> = {},
): Promise<{ subject: string; html: string } | null> {
  const template = await prisma.emailTemplate.findUnique({
    where: { key },
    include: { translations: true },
  });
  if (!template || !template.active) return null;

  const tr =
    template.translations.find((t) => t.locale === locale) ??
    template.translations.find((t) => t.locale === 'es');
  if (!tr) return null;

  return {
    subject: interpolate(tr.subject, vars),
    html: shell(interpolate(tr.body, vars).replace(/\n/g, '<br/>')),
  };
}

/** Envía un email a partir de una plantilla de BD y registra el log. */
export async function sendTemplatedEmail(
  key: string,
  to: string,
  locale: Locale,
  vars: Record<string, string> = {},
) {
  const rendered = await renderTemplate(key, locale, vars);
  if (!rendered) return { success: false, provider: 'none', error: 'template_not_found' };

  const result = await getEmailProvider().send({ to, subject: rendered.subject, html: rendered.html, locale });
  await prisma.emailLog.create({
    data: { toEmail: to, provider: result.provider, success: result.success, error: result.error ?? null },
  });
  return result;
}
