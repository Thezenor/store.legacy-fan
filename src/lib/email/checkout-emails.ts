import { getEmailProvider } from './index';

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

const T = {
  es: {
    subject: 'Reserva recibida · Legacy Fan',
    title: 'Hemos recibido tu reserva',
    intro: (amt: string) =>
      `Tu reserva de <strong>${amt}</strong> está confirmada. Recuerda: la reserva no asigna número de socio y se descontará del pago completo.`,
    cta: 'Ir a mi cuenta',
  },
  en: {
    subject: 'Reservation received · Legacy Fan',
    title: 'We received your reservation',
    intro: (amt: string) =>
      `Your reservation of <strong>${amt}</strong> is confirmed. Note: the reservation does not assign a member number and will be deducted from the full payment.`,
    cta: 'Go to my account',
  },
  fr: {
    subject: 'Réservation reçue · Legacy Fan',
    title: 'Nous avons reçu votre réservation',
    intro: (amt: string) =>
      `Votre réservation de <strong>${amt}</strong> est confirmée. Remarque : la réservation n'attribue pas de numéro de membre et sera déduite du paiement complet.`,
    cta: 'Accéder à mon compte',
  },
  it: {
    subject: 'Prenotazione ricevuta · Legacy Fan',
    title: 'Abbiamo ricevuto la tua prenotazione',
    intro: (amt: string) =>
      `La tua prenotazione di <strong>${amt}</strong> è confermata. Nota: la prenotazione non assegna un numero di socio e verrà detratta dal pagamento completo.`,
    cta: 'Vai al mio account',
  },
} as const;

const TF = {
  es: { subject: 'Bienvenido al Legacy Fan Club', title: 'Pago confirmado · Eres socio', intro: (n: string) => `Tu pago se ha confirmado y tu membresía está activa. Tu número de socio es <strong>${n}</strong>. Encontrarás tu carnet, productos incluidos y factura en tu cuenta.`, cta: 'Ir a mi cuenta' },
  en: { subject: 'Welcome to the Legacy Fan Club', title: 'Payment confirmed · You are a member', intro: (n: string) => `Your payment is confirmed and your membership is active. Your member number is <strong>${n}</strong>. Your card, included products and invoice are in your account.`, cta: 'Go to my account' },
  fr: { subject: 'Bienvenue au Legacy Fan Club', title: 'Paiement confirmé · Vous êtes membre', intro: (n: string) => `Votre paiement est confirmé et votre abonnement est actif. Votre numéro de membre est <strong>${n}</strong>. Votre carte, produits inclus et facture sont dans votre compte.`, cta: 'Accéder à mon compte' },
  it: { subject: 'Benvenuto nel Legacy Fan Club', title: 'Pagamento confermato · Sei socio', intro: (n: string) => `Il tuo pagamento è confermato e il tuo abbonamento è attivo. Il tuo numero di socio è <strong>${n}</strong>. La tua tessera, i prodotti inclusi e la fattura sono nel tuo account.`, cta: 'Vai al mio account' },
} as const;

export async function sendFullPaymentEmail(to: string, locale: Locale, memberNumber: string) {
  const t = TF[locale] ?? TF.es;
  const href = `${appUrl()}/${locale === 'es' ? '' : `${locale}/`}account`;
  return getEmailProvider().send({
    to,
    subject: t.subject,
    locale,
    html: shell(
      t.title,
      `<p>${t.intro(memberNumber)}</p><p><a href="${href}" style="display:inline-block;background:#C9A227;color:#0d0d0f;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">${t.cta}</a></p>`,
    ),
  });
}

export async function sendReservationReceivedEmail(to: string, locale: Locale, amountFormatted: string) {
  const t = T[locale] ?? T.es;
  const href = `${appUrl()}/${locale === 'es' ? '' : `${locale}/`}account`;
  return getEmailProvider().send({
    to,
    subject: t.subject,
    locale,
    html: shell(
      t.title,
      `<p>${t.intro(amountFormatted)}</p><p><a href="${href}" style="display:inline-block;background:#C9A227;color:#0d0d0f;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">${t.cta}</a></p>`,
    ),
  });
}
