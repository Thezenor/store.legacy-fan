// Capa de abstracción de email (doc 10). Configurable desde el superadmin
// (SystemSetting grupo 'email') con respaldo a variables de entorno.
// Proveedores: 'resend' (API), 'smtp' (nodemailer) y 'console' (desarrollo).

import { getSettingString } from '../commerce/settings';

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  /** Versión texto plano; si no se da, se deriva del HTML (evita MIME_HTML_ONLY). */
  text?: string;
  locale?: 'es' | 'en' | 'fr' | 'it';
}

/** Deriva texto plano legible a partir del HTML (para el multipart). */
function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<(br|\/p|\/div|\/h[1-6]|\/tr)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}

export interface SendEmailResult {
  success: boolean;
  provider: string;
  error?: string;
}

export interface EmailProvider {
  readonly key: string;
  send(input: SendEmailInput): Promise<SendEmailResult>;
}

interface EmailConfig {
  provider: 'resend' | 'smtp' | 'console';
  from: string;
  resendApiKey: string | null;
  smtp: { host: string | null; port: number; user: string | null; password: string | null; secure: boolean; helo: string | null };
}

/** Extrae el dominio de un remitente ("Nombre <x@dominio>" o "x@dominio"). */
function domainFromAddress(addr: string): string | null {
  const m = addr.match(/@([^>\s]+)/);
  return m ? m[1] : null;
}

/** Lee la configuración de email de la BD (grupo 'email') con respaldo a env. */
async function getEmailConfig(): Promise<EmailConfig> {
  const [provider, from, resendKey, host, port, user, pass, secure, helo] = await Promise.all([
    getSettingString('email.provider'),
    getSettingString('email.from'),
    getSettingString('email.resend.api_key'),
    getSettingString('email.smtp.host'),
    getSettingString('email.smtp.port'),
    getSettingString('email.smtp.user'),
    getSettingString('email.smtp.password'),
    getSettingString('email.smtp.secure'),
    getSettingString('email.smtp.helo'),
  ]);
  const prov = (provider || process.env.EMAIL_PROVIDER || 'console') as EmailConfig['provider'];
  const clean = (s: string | null | undefined) => (s ?? '').trim() || null;
  const sanitizeHost = (h: string | null) =>
    h ? h.replace(/^[a-z]+:\/\//i, '').replace(/[/\s].*$/, '').replace(/[[\]]/g, '').trim() || null : null;
  const smtpHost = sanitizeHost(clean(host) || clean(process.env.SMTP_HOST));
  const portNum = Number((clean(port) || clean(process.env.SMTP_PORT) || '587').replace(/\D/g, '')) || 587;
  const fromValue = clean(from) || process.env.EMAIL_FROM || 'Legacy Fan <no-reply@legacy-fan.com>';
  // Nombre para el HELO/EHLO del cliente. Debe ser un FQDN válido (nunca
  // [127.0.0.1]/localhost). Orden: ajuste manual → dominio del remitente → host.
  const heloName =
    sanitizeHost(clean(helo) || clean(process.env.SMTP_HELO)) ||
    domainFromAddress(fromValue) ||
    smtpHost ||
    null;
  return {
    provider: prov === 'resend' || prov === 'smtp' ? prov : 'console',
    from: fromValue,
    resendApiKey: clean(resendKey) || process.env.RESEND_API_KEY || null,
    smtp: {
      host: smtpHost,
      port: portNum,
      user: clean(user) || clean(process.env.SMTP_USER),
      password: (pass ?? '').trim() || process.env.SMTP_PASSWORD || null,
      secure: (secure ?? '') !== '' ? secure === 'true' : portNum === 465,
      helo: heloName,
    },
  };
}

async function sendViaResend(cfg: EmailConfig, input: SendEmailInput): Promise<SendEmailResult> {
  if (!cfg.resendApiKey) return { success: false, provider: 'resend', error: 'Falta la API key de Resend' };
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.resendApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: cfg.from, to: input.to, subject: input.subject, html: input.html, text: input.text || htmlToText(input.html) }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    return { success: false, provider: 'resend', error: `HTTP ${res.status} ${detail.slice(0, 120)}` };
  }
  return { success: true, provider: 'resend' };
}

async function sendViaSmtp(cfg: EmailConfig, input: SendEmailInput): Promise<SendEmailResult> {
  const { host, port, user, password, secure } = cfg.smtp;
  if (!host) return { success: false, provider: 'smtp', error: 'Falta el host SMTP' };
  try {
    const nodemailer = (await import('nodemailer')).default;
    const transport = nodemailer.createTransport({
      host,
      port,
      secure,
      // `name` es el hostname que el cliente anuncia en EHLO/HELO. Sin esto,
      // nodemailer usa os.hostname() del contenedor de Railway, que no es un
      // FQDN resoluble y acaba enviando "EHLO [127.0.0.1]". Forzamos un FQDN.
      name: cfg.smtp.helo || undefined,
      auth: user ? { user, pass: password ?? '' } : undefined,
    });
    const info = await transport.sendMail({ from: cfg.from, to: input.to, subject: input.subject, html: input.html, text: input.text || htmlToText(input.html) });
    // Si el servidor no acepta al destinatario, lo tratamos como fallo real.
    if (info.rejected && info.rejected.length > 0) {
      return { success: false, provider: 'smtp', error: `Rechazado: ${info.rejected.join(', ')} · ${info.response ?? ''}`.trim() };
    }
    return { success: true, provider: 'smtp', error: info.response ? `resp: ${info.response}` : undefined };
  } catch (e) {
    return { success: false, provider: 'smtp', error: e instanceof Error ? e.message : 'Error SMTP' };
  }
}

/** Proveedor "despachador": lee la config en cada envío y usa el proveedor activo. */
class ConfiguredEmailProvider implements EmailProvider {
  readonly key = 'configured';
  async send(input: SendEmailInput): Promise<SendEmailResult> {
    const cfg = await getEmailConfig();
    if (cfg.provider === 'resend') return sendViaResend(cfg, input);
    if (cfg.provider === 'smtp') return sendViaSmtp(cfg, input);
    // console: útil en desarrollo / cuando no hay proveedor configurado.
    // eslint-disable-next-line no-console
    console.info(`[email:console] -> ${input.to} | ${input.subject}`);
    return { success: true, provider: 'console' };
  }
}

const provider = new ConfiguredEmailProvider();

export function getEmailProvider(): EmailProvider {
  return provider;
}
