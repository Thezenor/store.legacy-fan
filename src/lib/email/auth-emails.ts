import { getEmailProvider } from './index';
import { emailShell, emailButton } from './templates';
import { appUrl } from '../app-url';

// Emails transaccionales de autenticación (verificación de correo y
// restablecimiento de contraseña). Usan la plantilla profesional emailShell
// (cabecera con logo + pie con RGPD, datos de empresa y enlaces legales).

type Locale = 'es' | 'en' | 'fr' | 'it';

const T = {
  verify: {
    es: {
      subject: 'Verifica tu correo · Legacy Fan',
      heading: 'Confirma tu correo electrónico',
      intro: 'Gracias por crear tu cuenta en Legacy Fan. Para activarla y poder reservar tu número de socio o completar tu compra, confirma que este correo es tuyo pulsando el botón:',
      cta: 'Verificar mi correo',
      expiry: 'Este enlace caduca en 24 horas por seguridad.',
      fallback: 'Si no creaste esta cuenta, puedes ignorar este mensaje: no se realizará ninguna acción.',
    },
    en: {
      subject: 'Verify your email · Legacy Fan',
      heading: 'Confirm your email address',
      intro: 'Thank you for creating your Legacy Fan account. To activate it and be able to reserve your member number or complete your purchase, confirm this email is yours by clicking the button:',
      cta: 'Verify my email',
      expiry: 'This link expires in 24 hours for your security.',
      fallback: 'If you did not create this account, you can safely ignore this message — no action will be taken.',
    },
    fr: {
      subject: 'Vérifiez votre e-mail · Legacy Fan',
      heading: 'Confirmez votre adresse e-mail',
      intro: 'Merci d’avoir créé votre compte Legacy Fan. Pour l’activer et pouvoir réserver votre numéro de membre ou finaliser votre achat, confirmez que cet e-mail est le vôtre :',
      cta: 'Vérifier mon e-mail',
      expiry: 'Ce lien expire dans 24 heures pour votre sécurité.',
      fallback: 'Si vous n’êtes pas à l’origine de ce compte, ignorez ce message.',
    },
    it: {
      subject: 'Verifica la tua email · Legacy Fan',
      heading: 'Conferma il tuo indirizzo email',
      intro: 'Grazie per aver creato il tuo account Legacy Fan. Per attivarlo e poter prenotare il tuo numero di socio o completare l’acquisto, conferma che questa email è tua:',
      cta: 'Verifica la mia email',
      expiry: 'Questo link scade tra 24 ore per la tua sicurezza.',
      fallback: 'Se non hai creato questo account, ignora questo messaggio.',
    },
  },
  reset: {
    es: {
      subject: 'Restablece tu contraseña · Legacy Fan',
      heading: 'Restablecer tu contraseña',
      intro: 'Hemos recibido una solicitud para restablecer la contraseña de tu cuenta. Pulsa el botón para crear una nueva:',
      cta: 'Crear nueva contraseña',
      expiry: 'Este enlace caduca en 1 hora por seguridad.',
      fallback: 'Si no solicitaste este cambio, ignora este mensaje: tu contraseña actual seguirá siendo válida.',
    },
    en: {
      subject: 'Reset your password · Legacy Fan',
      heading: 'Reset your password',
      intro: 'We received a request to reset your account password. Click the button to set a new one:',
      cta: 'Set a new password',
      expiry: 'This link expires in 1 hour for your security.',
      fallback: 'If you did not request this, ignore this message — your current password will stay valid.',
    },
    fr: {
      subject: 'Réinitialisez votre mot de passe · Legacy Fan',
      heading: 'Réinitialiser votre mot de passe',
      intro: 'Nous avons reçu une demande de réinitialisation de votre mot de passe. Cliquez pour en définir un nouveau :',
      cta: 'Définir un nouveau mot de passe',
      expiry: 'Ce lien expire dans 1 heure pour votre sécurité.',
      fallback: 'Si vous n’avez rien demandé, ignorez ce message ; votre mot de passe reste valable.',
    },
    it: {
      subject: 'Reimposta la password · Legacy Fan',
      heading: 'Reimposta la password',
      intro: 'Abbiamo ricevuto una richiesta di reimpostazione della password. Clicca per impostarne una nuova:',
      cta: 'Imposta nuova password',
      expiry: 'Questo link scade tra 1 ora per la tua sicurezza.',
      fallback: 'Se non l’hai richiesto, ignora questo messaggio; la password attuale resta valida.',
    },
  },
} as const;

const linkNote = (href: string) =>
  `<p style="margin:16px 0 0;font-size:12px;color:#8a877f;word-break:break-all">Si el botón no funciona, copia y pega este enlace en tu navegador:<br/>${href}</p>`;

function authBody(t: { heading: string; intro: string; cta: string; expiry: string; fallback: string }, href: string): string {
  return `
    <h2 style="font-family:Georgia,serif;color:#9C7E1C;font-size:19px;margin:0 0 12px">${t.heading}</h2>
    <p style="margin:0 0 4px">${t.intro}</p>
    ${emailButton(href, t.cta)}
    <p style="margin:0;font-size:13px;color:#666">${t.expiry}</p>
    <p style="margin:14px 0 0;font-size:13px;color:#666">${t.fallback}</p>
    ${linkNote(href)}`;
}

export async function sendVerificationEmail(to: string, locale: Locale, token: string) {
  const t = T.verify[locale] ?? T.verify.es;
  const href = `${appUrl()}/verify-email?token=${token}&email=${encodeURIComponent(to)}`;
  return getEmailProvider().send({ to, subject: t.subject, locale, html: emailShell(authBody(t, href), locale) });
}

export async function sendPasswordResetEmail(to: string, locale: Locale, token: string) {
  const t = T.reset[locale] ?? T.reset.es;
  const href = `${appUrl()}/reset-password?token=${token}&email=${encodeURIComponent(to)}`;
  return getEmailProvider().send({ to, subject: t.subject, locale, html: emailShell(authBody(t, href), locale) });
}
