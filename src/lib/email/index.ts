// Capa de abstracción de email (doc 10). Implementación inicial: Resend.
// 'console' útil en desarrollo; preparado para Brevo/otros en el futuro.

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

class ConsoleEmailProvider implements EmailProvider {
  readonly key = 'console';
  async send(input: SendEmailInput): Promise<SendEmailResult> {
    // eslint-disable-next-line no-console
    console.info(`[email:console] -> ${input.to} | ${input.subject}`);
    return { success: true, provider: this.key };
  }
}

class ResendEmailProvider implements EmailProvider {
  readonly key = 'resend';
  async send(input: SendEmailInput): Promise<SendEmailResult> {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM ?? 'Legacy Fan <no-reply@legacy-fan.com>';
    if (!apiKey) {
      return { success: false, provider: this.key, error: 'RESEND_API_KEY no configurada' };
    }
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to: input.to, subject: input.subject, html: input.html }),
    });
    if (!res.ok) {
      return { success: false, provider: this.key, error: `HTTP ${res.status}` };
    }
    return { success: true, provider: this.key };
  }
}

export function getEmailProvider(): EmailProvider {
  switch (process.env.EMAIL_PROVIDER) {
    case 'resend':
      return new ResendEmailProvider();
    case 'console':
    default:
      return new ConsoleEmailProvider();
  }
}
