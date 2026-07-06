import { getEmailProvider } from './index';
import { emailShell, emailButton, emailHighlight } from './templates';
import { appUrl } from '../app-url';

type Locale = 'es' | 'en' | 'fr' | 'it';

const accountHref = (locale: Locale) => `${appUrl()}/${locale === 'es' ? '' : `${locale}/`}account`;

// ── Reserva recibida (depósito de 50 €/$). La reserva YA asigna número. ──
const R = {
  es: {
    subject: 'Reserva confirmada · Legacy Fan',
    heading: 'Hemos recibido tu reserva',
    hlLabel: 'Depósito recibido',
    intro: 'Tu reserva está confirmada. Con ella queda asignado tu número de socio, que es permanente. El importe del depósito se descontará del pago completo cuando lo finalices.',
    next: 'Puedes ver tu número de socio, tu carnet y completar el pago cuando quieras desde tu cuenta.',
    cta: 'Ir a mi cuenta',
  },
  en: {
    subject: 'Reservation confirmed · Legacy Fan',
    heading: 'We received your reservation',
    hlLabel: 'Deposit received',
    intro: 'Your reservation is confirmed. It assigns your member number, which is permanent. The deposit will be deducted from the full payment when you complete it.',
    next: 'You can see your member number, your card and complete the payment anytime from your account.',
    cta: 'Go to my account',
  },
  fr: {
    subject: 'Réservation confirmée · Legacy Fan',
    heading: 'Nous avons reçu votre réservation',
    hlLabel: 'Acompte reçu',
    intro: 'Votre réservation est confirmée. Elle attribue votre numéro de membre, qui est permanent. L’acompte sera déduit du paiement complet.',
    next: 'Vous pouvez voir votre numéro de membre, votre carte et finaliser le paiement à tout moment depuis votre compte.',
    cta: 'Accéder à mon compte',
  },
  it: {
    subject: 'Prenotazione confermata · Legacy Fan',
    heading: 'Abbiamo ricevuto la tua prenotazione',
    hlLabel: 'Deposito ricevuto',
    intro: 'La tua prenotazione è confermata. Assegna il tuo numero di socio, che è permanente. Il deposito sarà detratto dal pagamento completo.',
    next: 'Puoi vedere il tuo numero di socio, la tua tessera e completare il pagamento quando vuoi dal tuo account.',
    cta: 'Vai al mio account',
  },
} as const;

// ── Pago completo · socio activo ──
const F = {
  es: {
    subject: '¡Bienvenido al Legacy Fan Club!',
    heading: 'Pago confirmado · Ya eres socio',
    hlLabel: 'Tu número de socio',
    intro: 'Tu pago se ha confirmado y tu membresía está activa. ¡Bienvenido al círculo Legacy Fan!',
    next: 'En tu cuenta encontrarás tu carnet de socio, los productos incluidos, tu factura y el acceso a la comunidad privada.',
    cta: 'Ver mi cuenta',
  },
  en: {
    subject: 'Welcome to the Legacy Fan Club!',
    heading: 'Payment confirmed · You are now a member',
    hlLabel: 'Your member number',
    intro: 'Your payment is confirmed and your membership is active. Welcome to the Legacy Fan circle!',
    next: 'In your account you will find your member card, included products, your invoice and access to the private community.',
    cta: 'View my account',
  },
  fr: {
    subject: 'Bienvenue au Legacy Fan Club !',
    heading: 'Paiement confirmé · Vous êtes membre',
    hlLabel: 'Votre numéro de membre',
    intro: 'Votre paiement est confirmé et votre abonnement est actif. Bienvenue dans le cercle Legacy Fan !',
    next: 'Dans votre compte : votre carte de membre, les produits inclus, votre facture et l’accès à la communauté privée.',
    cta: 'Voir mon compte',
  },
  it: {
    subject: 'Benvenuto nel Legacy Fan Club!',
    heading: 'Pagamento confermato · Sei socio',
    hlLabel: 'Il tuo numero di socio',
    intro: 'Il tuo pagamento è confermato e il tuo abbonamento è attivo. Benvenuto nel circolo Legacy Fan!',
    next: 'Nel tuo account trovi la tessera socio, i prodotti inclusi, la fattura e l’accesso alla comunità privata.',
    cta: 'Vai al mio account',
  },
} as const;

export async function sendReservationReceivedEmail(to: string, locale: Locale, amountFormatted: string) {
  const t = R[locale] ?? R.es;
  const body = `
    <h2 style="font-family:'Inter',Arial,Helvetica,sans-serif;color:#9C7E1C;font-size:19px;margin:0 0 12px">${t.heading}</h2>
    <p style="margin:0 0 4px">${t.intro}</p>
    ${emailHighlight(t.hlLabel, amountFormatted)}
    <p style="margin:0 0 4px">${t.next}</p>
    ${emailButton(accountHref(locale), t.cta)}`;
  return getEmailProvider().send({ to, subject: t.subject, locale, html: emailShell(body, locale) });
}

export async function sendFullPaymentEmail(to: string, locale: Locale, memberNumber: string) {
  const t = F[locale] ?? F.es;
  const body = `
    <h2 style="font-family:'Inter',Arial,Helvetica,sans-serif;color:#9C7E1C;font-size:19px;margin:0 0 12px">${t.heading}</h2>
    <p style="margin:0 0 4px">${t.intro}</p>
    ${emailHighlight(t.hlLabel, memberNumber)}
    <p style="margin:0 0 4px">${t.next}</p>
    ${emailButton(accountHref(locale), t.cta)}`;
  return getEmailProvider().send({ to, subject: t.subject, locale, html: emailShell(body, locale) });
}
