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

/** Botón dorado (CTA) para emails, con estilos en línea (email-safe). */
export function emailButton(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0"><tr><td style="border-radius:8px;background:#c8a24b">
    <a href="${href}" style="display:inline-block;padding:13px 26px;font-family:Georgia,serif;font-size:14px;font-weight:bold;letter-spacing:0.04em;color:#1a1408;text-decoration:none">${label}</a>
  </td></tr></table>`;
}

/** Bloque destacado (dato clave: número de socio, importe, fecha…). */
export function emailHighlight(label: string, value: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;border:1px solid #eadfbf;border-radius:10px;background:#faf6ea"><tr><td style="padding:14px 18px">
    <div style="font-family:Georgia,serif;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#9a8038">${label}</div>
    <div style="font-family:Georgia,serif;font-size:20px;color:#1a1408;margin-top:3px">${value}</div>
  </td></tr></table>`;
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
  const serif = "Georgia,'Times New Roman',serif";
  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
<title>Legacy Fan</title>
</head>
<body style="margin:0;padding:0;background:#e9e6df;font-family:${serif}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e9e6df">
    <tr><td align="center" style="padding:30px 12px">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#ffffff;border:1px solid #e4dcc4;border-radius:14px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08)">

        <!-- Cabecera / logo Art Deco -->
        <tr><td style="background:#0b0b0d;padding:32px 24px 26px;text-align:center;border-bottom:2px solid #c8a24b">
          <div style="font-size:11px;letter-spacing:5px;color:#8a7433;margin-bottom:12px">&#10022;&nbsp;&nbsp;MMXXVI&nbsp;&nbsp;&#10022;</div>
          <div style="font-size:27px;letter-spacing:9px;color:#c8a24b;font-weight:bold;font-family:${serif}">LEGACY&nbsp;FAN</div>
          <div style="font-size:10px;letter-spacing:5px;color:#9a8038;margin-top:9px">PRECIOUS&nbsp;METALS</div>
        </td></tr>

        <!-- Cuerpo -->
        <tr><td style="padding:34px 34px 8px;color:#1f1e1c;font-size:15px;line-height:1.7;font-family:${serif}">
          ${bodyHtml}
        </td></tr>

        <!-- Ornamento dorado -->
        <tr><td style="padding:22px 34px 8px" align="center">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="width:120px;border-bottom:1px solid #e2d9c2">&nbsp;</td>
            <td style="padding:0 12px;color:#c8a24b;font-size:13px">&#10022;</td>
            <td style="width:120px;border-bottom:1px solid #e2d9c2">&nbsp;</td>
          </tr></table>
        </td></tr>

        <!-- Pie -->
        <tr><td style="background:#faf8f3;padding:24px 32px;color:#807d75;font-size:11px;line-height:1.65;font-family:${serif};border-top:1px solid #efeae0">
          <p style="margin:0">${f.disclaimer}</p>
          <p style="margin:10px 0 0">${f.data}</p>
          <p style="margin:14px 0 0;text-align:center">${link('/legal/privacy', f.privacy)} &nbsp;&#10022;&nbsp; ${link('/legal/terms', f.terms)} &nbsp;&#10022;&nbsp; ${link('/legal/cookies', f.cookies)}</p>
        </td></tr>
      </table>

      <!-- Datos de empresa bajo la tarjeta -->
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px">
        <tr><td style="padding:16px 12px 0;text-align:center;color:#9c988e;font-size:10.5px;line-height:1.6;font-family:${serif}">
          Legacy Fan LLC &nbsp;·&nbsp; 8 The Green STE R, Dover, DE 19901 (Delaware, USA) &nbsp;·&nbsp; info@legacy-fan.com<br/>
          © 2026 Legacy Fan LLC. ${f.rights}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Renderiza una plantilla de email de la BD (gestionada desde superadmin).
 * Fallback de idioma a ES. Devuelve null si la plantilla no existe o está inactiva.
 */
const ACCOUNT_CTA: Record<Locale, string> = {
  es: 'Ir a mi cuenta',
  en: 'Go to my account',
  fr: 'Accéder à mon compte',
  it: 'Vai al mio account',
};

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

  // Variable por defecto: enlace a la cuenta (para el CTA de estos correos).
  const accountUrl = `${appUrl()}${locale === 'es' ? '' : `/${locale}`}/account`;
  const allVars = { accountUrl, ...vars };

  // Cuerpo (texto con {{vars}} y saltos de línea) + botón "Ir a mi cuenta".
  const bodyHtml =
    interpolate(tr.body, allVars).replace(/\n/g, '<br/>') +
    emailButton(accountUrl, ACCOUNT_CTA[locale] ?? ACCOUNT_CTA.es);

  return {
    subject: interpolate(tr.subject, allVars),
    html: emailShell(bodyHtml, locale),
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
