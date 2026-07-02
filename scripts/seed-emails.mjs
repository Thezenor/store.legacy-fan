// Re-siembra las plantillas de email (ES+EN) con las versiones profesionales.
// Uso: NODE_OPTIONS=--use-system-ca node scripts/seed-emails.mjs
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const TEMPLATES = [
  {
    key: 'account.welcome',
    es: { subject: 'Bienvenido a Legacy Fan', body: 'Hola {{firstName}}:\n\nGracias por crear tu cuenta en Legacy Fan Club, el círculo de coleccionismo en metales preciosos (plata .999 y cobre .999) con piezas de edición limitada y numeradas.\n\nDesde tu cuenta puedes reservar tu número de socio, elegir tu club y seguir tus pedidos y beneficios.\n\nSi tienes cualquier duda, escríbenos a info@legacy-fan.com.' },
    en: { subject: 'Welcome to Legacy Fan', body: 'Hi {{firstName}},\n\nThank you for creating your account at Legacy Fan Club, the precious-metals collecting circle (silver .999 and copper .999) with limited, numbered editions.\n\nFrom your account you can reserve your member number, choose your club and track your orders and benefits.\n\nIf you have any questions, write to us at info@legacy-fan.com.' },
  },
  {
    key: 'reservation.received',
    es: { subject: 'Reserva confirmada · Legacy Fan', body: 'Hola {{firstName}}:\n\nHemos recibido tu reserva de {{amount}}. Con ella queda asignado tu número de socio, que es permanente.\n\nEl importe del depósito se descontará del pago completo cuando lo finalices. Puedes completarlo cuando quieras desde tu cuenta.' },
    en: { subject: 'Reservation confirmed · Legacy Fan', body: 'Hi {{firstName}},\n\nWe have received your reservation of {{amount}}. It assigns your member number, which is permanent.\n\nThe deposit will be deducted from the full payment when you complete it. You can do so anytime from your account.' },
  },
  {
    key: 'reservation.reminder',
    es: { subject: 'Recordatorio: completa tu reserva · Legacy Fan', body: 'Hola {{firstName}}:\n\nTu reserva sigue pendiente de pago completo. Para asegurar tu pieza y conservar tu número de socio, completa el pago antes del {{deadline}}.\n\nEl depósito ya pagado se descuenta del total. Puedes finalizarlo desde tu cuenta.' },
    en: { subject: 'Reminder: complete your reservation · Legacy Fan', body: 'Hi {{firstName}},\n\nYour reservation is still pending full payment. To secure your piece and keep your member number, complete the payment before {{deadline}}.\n\nThe deposit already paid is deducted from the total. You can finish it from your account.' },
  },
  {
    key: 'payment.confirmed',
    es: { subject: '¡Bienvenido al Legacy Fan Club! · Pago confirmado', body: 'Hola {{firstName}}:\n\nTu pago se ha confirmado y tu membresía está activa. ¡Bienvenido al círculo Legacy Fan!\n\nTu número de socio es {{memberNumber}} (permanente). En tu cuenta encontrarás tu carnet de socio, los productos incluidos, tu factura y el acceso a la comunidad privada.' },
    en: { subject: 'Welcome to the Legacy Fan Club! · Payment confirmed', body: 'Hi {{firstName}},\n\nYour payment is confirmed and your membership is active. Welcome to the Legacy Fan circle!\n\nYour member number is {{memberNumber}} (permanent). In your account you will find your member card, included products, your invoice and access to the private community.' },
  },
  {
    key: 'community.welcome',
    es: { subject: 'Tu acceso a la comunidad · Legacy Fan', body: 'Hola {{firstName}}:\n\nTu acceso a la comunidad privada de Legacy Fan (Telegram y Discord) ya está disponible en tu cuenta.\n\nAllí encontrarás avances de lanzamientos, contenido exclusivo y la comunidad de coleccionistas.' },
    en: { subject: 'Your community access · Legacy Fan', body: 'Hi {{firstName}},\n\nYour access to the private Legacy Fan community (Telegram and Discord) is now available in your account.\n\nThere you will find launch previews, exclusive content and the collectors’ community.' },
  },
  {
    key: 'points.added',
    es: { subject: 'Has ganado saldo · Legacy Fan', body: 'Hola {{firstName}}:\n\nHemos añadido {{amount}} de saldo a tu cuenta Legacy Fan. Podrás usarlo en futuras compras según las condiciones del programa.\n\nConsulta tu saldo y movimientos en tu cuenta.' },
    en: { subject: 'You earned balance · Legacy Fan', body: 'Hi {{firstName}},\n\nWe have added {{amount}} of balance to your Legacy Fan account. You can use it on future purchases under the program terms.\n\nCheck your balance and history in your account.' },
  },
];

async function run() {
  for (const t of TEMPLATES) {
    const tpl = await prisma.emailTemplate.upsert({
      where: { key: t.key },
      update: {},
      create: { key: t.key, active: true },
    });
    for (const loc of ['es', 'en']) {
      await prisma.emailTemplateTranslation.upsert({
        where: { templateId_locale: { templateId: tpl.id, locale: loc } },
        update: { subject: t[loc].subject, body: t[loc].body },
        create: { templateId: tpl.id, locale: loc, subject: t[loc].subject, body: t[loc].body },
      });
    }
    console.log('actualizada:', t.key);
  }
  await prisma.$disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
