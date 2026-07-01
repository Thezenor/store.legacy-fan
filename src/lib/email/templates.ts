import { prisma } from '../prisma';
import { getEmailProvider } from './index';
import { appUrl } from '../app-url';

type Locale = 'es' | 'en' | 'fr' | 'it';

// Textos del pie por idioma (protección de datos + enlaces legales).
const FOOTER: Record<Locale, { disclaimer: string; data: string; privacy: string; terms: string; cookies: string; rights: string }> = {
  es: {
    disclaimer: 'Los productos Legacy Fan son artículos coleccionables. No constituyen producto financiero ni promesa de rentabilidad futura.',
    data: 'Protección de datos: Legacy Fan LLC trata tus datos como responsable para gestionar tu cuenta, pedidos y comunicaciones del club. Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a info@legacy-fan.com.',
    privacy: 'Privacidad', terms: 'Términos', cookies: 'Cookies', rights: 'Todos los derechos reservados.',
  },
  en: {
    disclaimer: 'Legacy Fan products are collectible items. They are not a financial product or a promise of future returns.',
    data: 'Data protection: Legacy Fan LLC processes your data as controller to manage your account, orders and club communications. You may exercise your rights of access, rectification, erasure, objection, restriction and portability by writing to info@legacy-fan.com.',
    privacy: 'Privacy', terms: 'Terms', cookies: 'Cookies', rights: 'All rights reserved.',
  },
  fr: {
    disclaimer: "Les produits Legacy Fan sont des articles de collection. Ils ne constituent pas un produit financier ni une promesse de rendement futur.",
    data: "Protection des données : Legacy Fan LLC traite vos données en tant que responsable pour gérer votre compte, vos commandes et les communications du club. Vous pouvez exercer vos droits d'accès, de rectification, d'effacement, d'opposition, de limitation et de portabilité en écrivant à info@legacy-fan.com.",
    privacy: 'Confidentialité', terms: 'Conditions', cookies: 'Cookies', rights: 'Tous droits réservés.',
  },
  it: {
    disclaimer: 'I prodotti Legacy Fan sono articoli da collezione. Non costituiscono un prodotto finanziario né una promessa di rendimento futuro.',
    data: 'Protezione dei dati: Legacy Fan LLC tratta i tuoi dati come titolare per gestire il tuo account, gli ordini e le comunicazioni del club. Puoi esercitare i diritti di accesso, rettifica, cancellazione, opposizione, limitazione e portabilità scrivendo a info@legacy-fan.com.',
    privacy: 'Privacy', terms: 'Termini', cookies: 'Cookie', rights: 'Tutti i diritti riservati.',
  },
};

/** Interpola {{var}} con los valores dados (escapando HTML básico). */
function interpolate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => {
    const v = vars[k] ?? '';
    return String(v).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c]!);
  });
}

/**
 * Envuelve el cuerpo en la plantilla de email profesional (cabecera con
 * wordmark, cuerpo y pie con protección de datos y enlaces legales).
 * Estilos en línea y estructura email-safe. Localizada.
 */
export function emailShell(bodyHtml: string, locale: Locale = 'es'): string {
  const f = FOOTER[locale] ?? FOOTER.es;
  const base = appUrl();
  const prefix = locale === 'es' ? '' : `/${locale}`;
  const link = (path: string, label: string) =>
    `<a href="${base}${prefix}${path}" style="color:#9C7E1C;text-decoration:none">${label}</a>`;
  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
<title>Legacy Fan</title>
</head>
<body style="margin:0;padding:0;background:#eceae4">
  <div style="max-width:600px;margin:0 auto;padding:24px 12px;font-family:Georgia,'Times New Roman',serif">
    <!-- Cabecera / logo -->
    <div style="background:#0a0a0c;border-radius:10px 10px 0 0;padding:30px 24px;text-align:center">
      <div style="font-size:24px;letter-spacing:6px;color:#c8a24b;font-weight:bold">LEGACY FAN</div>
      <div style="font-size:10px;letter-spacing:5px;color:#9a8038;margin-top:6px">PRECIOUS METALS</div>
    </div>
    <div style="height:2px;background:#c8a24b"></div>
    <!-- Cuerpo -->
    <div style="background:#ffffff;padding:32px 28px;color:#1a1a1a;font-size:15px;line-height:1.65">
      ${bodyHtml}
    </div>
    <!-- Pie -->
    <div style="background:#f4f3ef;border-radius:0 0 10px 10px;padding:22px 28px;color:#7a776f;font-size:11px;line-height:1.6">
      <p style="margin:0">${f.disclaimer}</p>
      <p style="margin:10px 0 0">${f.data}</p>
      <p style="margin:12px 0 0">${link('/legal/privacy', f.privacy)} &nbsp;·&nbsp; ${link('/legal/terms', f.terms)} &nbsp;·&nbsp; ${link('/legal/cookies', f.cookies)}</p>
      <p style="margin:14px 0 0;color:#a8a49b">Legacy Fan LLC · 8 The Green STE R, Dover, DE 19901 (Delaware, USA) · info@legacy-fan.com</p>
      <p style="margin:2px 0 0;color:#b7b3aa">© 2026 Legacy Fan LLC. ${f.rights}</p>
    </div>
  </div>
</body>
</html>`;
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
    html: emailShell(interpolate(tr.body, vars).replace(/\n/g, '<br/>'), locale),
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
