import { getEmailProvider } from './index';

// Emails transaccionales de auth (doc 10). Plantillas mínimas inline para el MVP;
// en el Módulo 11 se migran a plantillas en BD multiidioma editables desde admin.

type Locale = 'es' | 'en' | 'fr' | 'it';

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

function shell(title: string, bodyHtml: string): string {
  return `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;color:#16161a">
    <h1 style="color:#9C7E1C;font-size:20px">Legacy Fan</h1>
    <h2 style="font-size:18px">${title}</h2>
    ${bodyHtml}
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
    <p style="font-size:12px;color:#888">Los productos Legacy Fan son artículos coleccionables. No constituyen producto financiero ni promesa de rentabilidad futura.</p>
  </div>`;
}

const btn = (href: string, label: string) =>
  `<p><a href="${href}" style="display:inline-block;background:#C9A227;color:#0d0d0f;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">${label}</a></p>`;

const T = {
  verify: {
    es: { subject: 'Verifica tu correo · Legacy Fan', title: 'Confirma tu correo', intro: 'Gracias por crear tu cuenta. Confirma tu correo para poder reservar o comprar:', cta: 'Verificar correo', fallback: 'Si no creaste esta cuenta, ignora este mensaje.' },
    en: { subject: 'Verify your email · Legacy Fan', title: 'Confirm your email', intro: 'Thanks for creating your account. Confirm your email to reserve or buy:', cta: 'Verify email', fallback: 'If you did not create this account, ignore this message.' },
    fr: { subject: 'Vérifiez votre e-mail · Legacy Fan', title: 'Confirmez votre e-mail', intro: 'Merci d’avoir créé votre compte. Confirmez votre e-mail pour réserver ou acheter :', cta: 'Vérifier l’e-mail', fallback: 'Si vous n’êtes pas à l’origine de ce compte, ignorez ce message.' },
    it: { subject: 'Verifica la tua email · Legacy Fan', title: 'Conferma la tua email', intro: 'Grazie per aver creato il tuo account. Conferma la tua email per prenotare o acquistare:', cta: 'Verifica email', fallback: 'Se non hai creato questo account, ignora questo messaggio.' },
  },
  reset: {
    es: { subject: 'Restablece tu contraseña · Legacy Fan', title: 'Restablecer contraseña', intro: 'Has solicitado restablecer tu contraseña. El enlace caduca en 1 hora:', cta: 'Crear nueva contraseña', fallback: 'Si no lo solicitaste, ignora este mensaje; tu contraseña no cambiará.' },
    en: { subject: 'Reset your password · Legacy Fan', title: 'Reset password', intro: 'You requested a password reset. This link expires in 1 hour:', cta: 'Set new password', fallback: 'If you did not request this, ignore this message; your password will not change.' },
    fr: { subject: 'Réinitialisez votre mot de passe · Legacy Fan', title: 'Réinitialiser le mot de passe', intro: 'Vous avez demandé une réinitialisation. Ce lien expire dans 1 heure :', cta: 'Définir un nouveau mot de passe', fallback: 'Si vous n’avez rien demandé, ignorez ce message.' },
    it: { subject: 'Reimposta la password · Legacy Fan', title: 'Reimposta la password', intro: 'Hai richiesto di reimpostare la password. Il link scade tra 1 ora:', cta: 'Imposta nuova password', fallback: 'Se non l’hai richiesto, ignora questo messaggio.' },
  },
} as const;

export async function sendVerificationEmail(to: string, locale: Locale, token: string) {
  const t = T.verify[locale] ?? T.verify.es;
  const href = `${appUrl()}/verify-email?token=${token}&email=${encodeURIComponent(to)}`;
  return getEmailProvider().send({
    to,
    subject: t.subject,
    locale,
    html: shell(t.title, `<p>${t.intro}</p>${btn(href, t.cta)}<p style="font-size:12px;color:#888">${t.fallback}</p>`),
  });
}

export async function sendPasswordResetEmail(to: string, locale: Locale, token: string) {
  const t = T.reset[locale] ?? T.reset.es;
  const href = `${appUrl()}/reset-password?token=${token}&email=${encodeURIComponent(to)}`;
  return getEmailProvider().send({
    to,
    subject: t.subject,
    locale,
    html: shell(t.title, `<p>${t.intro}</p>${btn(href, t.cta)}<p style="font-size:12px;color:#888">${t.fallback}</p>`),
  });
}
