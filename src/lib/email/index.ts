// Capa de abstracción de email (doc 10). Configurable desde el superadmin
// (SystemSetting grupo 'email') con respaldo a variables de entorno.
// Proveedores: 'resend' (API), 'smtp' (nodemailer) y 'console' (desarrollo).

import { getSettingString } from '../commerce/settings';

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  locale?: 'es' | 'en' | 'fr' | 'it';
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
  smtp: { host: string | null; port: number; user: string | null; password: string | null; secure: boolean };
}

/** Lee la configuración de email de la BD (grupo 'email') con respaldo a env. */
async function getEmailConfig(): Promise<EmailConfig> {
  const [provider, from, resendKey, host, port, user, pass, secure] = await Promise.all([
    getSettingString('email.provider'),
    getSettingString('email.from'),
    getSettingString('email.resend.api_key'),
    getSettingString('email.smtp.host'),
    getSettingString('email.smtp.port'),
    getSettingString('email.smtp.user'),
    getSettingString('email.smtp.password'),
    getSettingString('email.smtp.secure'),
  ]);
  const prov = (provider || process.env.EMAIL_PROVIDER || 'console') as EmailConfig['provider'];
  const clean = (s: string | null | undefined) => (s ?? '').trim() || null;
  const rawHost = clean(host) || clean(process.env.SMTP_HOST);
  // Sanea el host: quita espacios, protocolo pegado por error y barras.
  const smtpHost = rawHost
    ? rawHost.replace(/^[a-z]+:\/\//i, '').replace(/[/\s].*$/, '').trim() || null
    : null;
  const portNum = Number((clean(port) || clean(process.env.SMTP_PORT) || '587').replace(/\D/g, '')) || 587;
  return {
    provider: prov === 'resend' || prov === 'smtp' ? prov : 'console',
    from: clean(from) || process.env.EMAIL_FROM || 'Legacy Fan <no-reply@legacy-fan.com>',
    resendApiKey: clean(resendKey) || process.env.RESEND_API_KEY || null,
    smtp: {
      host: smtpHost,
      port: portNum,
      user: clean(user) || clean(process.env.SMTP_USER),
      password: (pass ?? '').trim() || process.env.SMTP_PASSWORD || null,
      secure: (secure ?? '') !== '' ? secure === 'true' : portNum === 465,
    },
  };
}

async function sendViaResend(cfg: EmailConfig, input: SendEmailInput): Promise<SendEmailResult> {
  if (!cfg.resendApiKey) return { success: false, provider: 'resend', error: 'Falta la API key de Resend' };
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.resendApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: cfg.from, to: input.to, subject: input.subject, html: input.html }),
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
      auth: user ? { user, pass: password ?? '' } : undefined,
    });
    const info = await transport.sendMail({ from: cfg.from, to: input.to, subject: input.subject, html: input.html });
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
