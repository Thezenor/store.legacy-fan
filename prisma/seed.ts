/**
 * Seed inicial Legacy Fan.
 * Carga: roles + permisos, planes Prime/Prestige con fases y precios (doc 02),
 * ajustes del sistema (pasarelas, fiscal, puntos, referidos), disclaimer legal,
 * y el bloque reservado de números de socio 1–100 (doc 04).
 *
 * Idempotente: usa upsert siempre que es posible.
 */
import {
  PrismaClient,
  ClubType,
  ReferralRewardMode,
  Locale,
  CollectionStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

const ROLES = [
  { key: 'superadmin', name: 'Superadmin' },
  { key: 'admin', name: 'Admin' },
  { key: 'marketing', name: 'Marketing' },
  { key: 'soporte', name: 'Soporte' },
  { key: 'logistica', name: 'Logística' },
  { key: 'finanzas', name: 'Finanzas' },
  { key: 'editor', name: 'Editor de contenido' },
];

// Precios por fase (doc 02). Importes en céntimos.
const PRIME_PHASES = [
  { key: 'FASE_0', name: 'Fase 0', eur: 14900, usd: 17900, free: true, freeCountries: ['ES'] },
  { key: 'FASE_1', name: 'Fase 1', eur: 14900, usd: 17900 },
  { key: 'FASE_2', name: 'Fase 2', eur: 14900, usd: 17900 },
  { key: 'FASE_3', name: 'Fase 3', eur: 17900, usd: 20900 },
  { key: 'FASE_4', name: 'Fase 4', eur: 19900, usd: 22900 },
];

const PRESTIGE_PHASES = [
  { key: 'FASE_0', name: 'Fase 0', eur: 59900, usd: 69900, free: true, freeCountries: ['ES'] },
  { key: 'FASE_1', name: 'Fase 1', eur: 59900, usd: 69900 },
  { key: 'FASE_2', name: 'Fase 2', eur: 59900, usd: 69900 },
  { key: 'FASE_3', name: 'Fase 3', eur: 69900, usd: 79900 },
  { key: 'FASE_4', name: 'Fase 4', eur: 89900, usd: 99900 },
];

const SYSTEM_SETTINGS: { key: string; group: string; value: unknown }[] = [
  // Pasarelas: PayPal activo, Stripe preparado pero desactivado
  { key: 'payments.paypal.enabled', group: 'payments', value: true },
  { key: 'payments.stripe.enabled', group: 'payments', value: false },
  { key: 'payments.mode', group: 'payments', value: 'test' },
  // Reserva
  { key: 'reservation.amount.eur', group: 'payments', value: 5000 },
  { key: 'reservation.amount.usd', group: 'payments', value: 5000 },
  { key: 'reservation.grace_days_after_launch', group: 'payments', value: 7 },
  { key: 'reservation.refundable_hours_before_launch', group: 'payments', value: 24 },
  // Lanzamiento (configurable desde admin)
  { key: 'launch.date', group: 'phases', value: null },
  // Puntos
  { key: 'points.ratio_per_currency_unit', group: 'points', value: 1 }, // puntos por € o $ de premium
  { key: 'points.expiry_years', group: 'points', value: 2 },
  // Referidos
  { key: 'referrals.default_reward_mode', group: 'referrals', value: 'SPLIT_50_50' },
  // Upsell segunda moneda: SOLO Prestige (decisión aprobada)
  { key: 'upsell.second_coin.enabled_prime', group: 'products', value: false },
  { key: 'upsell.second_coin.enabled_prestige', group: 'products', value: true },
  // Fiscal / empresa
  { key: 'fiscal.company_name', group: 'fiscal', value: 'Legacy Fan LLC' },
  { key: 'fiscal.address', group: 'fiscal', value: '8 The Green STE R, Dover, DE 19901' },
  { key: 'fiscal.email', group: 'fiscal', value: 'info@legacy-fan.com' },
  { key: 'fiscal.base_country', group: 'fiscal', value: 'US' },
  { key: 'fiscal.base_currency', group: 'fiscal', value: 'EUR' },
  { key: 'fiscal.invoice_series', group: 'fiscal', value: 'LF' },
  // Sistema
  { key: 'system.maintenance_mode', group: 'system', value: false },
];

const DISCLAIMER =
  'Los productos Legacy Fan son artículos coleccionables. No constituyen producto financiero ni promesa de rentabilidad futura.';

async function seedRoles() {
  for (const r of ROLES) {
    await prisma.role.upsert({
      where: { key: r.key },
      update: { name: r.name },
      create: { key: r.key, name: r.name },
    });
  }
}

async function seedPlan(club: ClubType, slug: string, name: string, phases: typeof PRIME_PHASES) {
  const plan = await prisma.membershipPlan.upsert({
    where: { club },
    update: { name, slug },
    create: { club, name, slug },
  });

  for (let i = 0; i < phases.length; i++) {
    const p = phases[i];
    await prisma.membershipPhase.upsert({
      where: { planId_key: { planId: plan.id, key: p.key } },
      update: {
        name: p.name,
        priceEurCents: p.eur,
        priceUsdCents: p.usd,
        freeShipping: p.free ?? false,
        freeShippingCountries: p.freeCountries ?? [],
        sortOrder: i,
      },
      create: {
        planId: plan.id,
        key: p.key,
        name: p.name,
        priceEurCents: p.eur,
        priceUsdCents: p.usd,
        freeShipping: p.free ?? false,
        freeShippingCountries: p.freeCountries ?? [],
        isActive: i === 0,
        sortOrder: i,
      },
    });
  }
}

async function seedSettings() {
  for (const s of SYSTEM_SETTINGS) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value as object, group: s.group },
      create: { key: s.key, value: s.value as object, group: s.group },
    });
  }
}

async function seedReservedMemberNumbers() {
  // 1–50 reservados a asignación manual (decisión usuario; 51+ libres). Idempotente.
  const existing = await prisma.memberNumber.count({ where: { isReserved: true } });
  if (existing >= 50) return;
  const data = [];
  for (let n = 1; n <= 50; n++) {
    data.push({
      number: n,
      formatted: `LF-${String(n).padStart(6, '0')}`,
      isReserved: true,
    });
  }
  await prisma.memberNumber.createMany({ data, skipDuplicates: true });
}

async function seedLegalDisclaimer() {
  const locales: Locale[] = [Locale.es, Locale.en, Locale.fr, Locale.it];
  for (const locale of locales) {
    await prisma.legalPage.upsert({
      where: { slug_locale: { slug: 'disclaimer', locale } },
      update: { body: DISCLAIMER },
      create: { slug: 'disclaimer', locale, title: 'Disclaimer', body: DISCLAIMER },
    });
  }
}

// Páginas legales (doc 09/15). Contenido inicial de marcador, editable desde superadmin.
const LEGAL_PAGES: { slug: string; es: string; en: string }[] = [
  { slug: 'terms', es: 'Términos y condiciones', en: 'Terms and conditions' },
  { slug: 'privacy', es: 'Política de privacidad', en: 'Privacy policy' },
  { slug: 'cookies', es: 'Política de cookies', en: 'Cookie policy' },
  { slug: 'shipping', es: 'Política de envíos', en: 'Shipping policy' },
  { slug: 'returns', es: 'Política de devoluciones', en: 'Returns policy' },
  { slug: 'membership', es: 'Condiciones de membresía', en: 'Membership terms' },
  { slug: 'points', es: 'Condiciones de puntos', en: 'Points terms' },
  { slug: 'referrals', es: 'Condiciones de referidos', en: 'Referral terms' },
];

async function seedLegalPages() {
  const placeholder = (title: string) =>
    `${title}\n\nContenido pendiente de redacción. Esta página es editable desde el superadmin (/lf-admin).`;
  const placeholderEn = (title: string) =>
    `${title}\n\nContent to be drafted. This page is editable from the superadmin (/lf-admin).`;

  for (const p of LEGAL_PAGES) {
    await prisma.legalPage.upsert({
      where: { slug_locale: { slug: p.slug, locale: Locale.es } },
      update: {},
      create: { slug: p.slug, locale: Locale.es, title: p.es, body: placeholder(p.es) },
    });
    await prisma.legalPage.upsert({
      where: { slug_locale: { slug: p.slug, locale: Locale.en } },
      update: {},
      create: { slug: p.slug, locale: Locale.en, title: p.en, body: placeholderEn(p.en) },
    });
  }
}

// Plantillas de email esenciales (doc 10), editables desde superadmin.
const EMAIL_TEMPLATES: {
  key: string;
  es: { subject: string; body: string };
  en: { subject: string; body: string };
}[] = [
  {
    key: 'account.welcome',
    es: { subject: 'Bienvenido a Legacy Fan', body: 'Hola {{firstName}}, gracias por crear tu cuenta en Legacy Fan.' },
    en: { subject: 'Welcome to Legacy Fan', body: 'Hi {{firstName}}, thanks for creating your Legacy Fan account.' },
  },
  {
    key: 'reservation.received',
    es: { subject: 'Reserva recibida', body: 'Tu reserva de {{amount}} está confirmada. Se descontará del pago completo.' },
    en: { subject: 'Reservation received', body: 'Your reservation of {{amount}} is confirmed. It will be deducted from the full payment.' },
  },
  {
    key: 'reservation.reminder',
    es: { subject: 'Recordatorio: completa tu reserva', body: 'Hola {{firstName}}, recuerda completar el pago de tu reserva antes de {{deadline}}.' },
    en: { subject: 'Reminder: complete your reservation', body: 'Hi {{firstName}}, remember to complete your reservation payment before {{deadline}}.' },
  },
  {
    key: 'payment.confirmed',
    es: { subject: 'Pago confirmado · Eres socio', body: 'Tu membresía está activa. Tu número de socio es {{memberNumber}}.' },
    en: { subject: 'Payment confirmed · You are a member', body: 'Your membership is active. Your member number is {{memberNumber}}.' },
  },
  {
    key: 'community.welcome',
    es: { subject: 'Bienvenido a la comunidad', body: 'Tus accesos a Telegram y Discord ya están disponibles en tu cuenta.' },
    en: { subject: 'Welcome to the community', body: 'Your Telegram and Discord access is now available in your account.' },
  },
  {
    key: 'points.added',
    es: { subject: 'Has ganado saldo', body: 'Se ha añadido {{amount}} de saldo a tu cuenta.' },
    en: { subject: 'You earned balance', body: '{{amount}} of balance has been added to your account.' },
  },
];

// Colecciones iniciales (alineadas con el catálogo de marca).
const COLLECTIONS: { slug: string; name: string; status: CollectionStatus; sortOrder: number }[] = [
  { slug: 'world-peace', name: 'World Peace', status: CollectionStatus.ACTIVA, sortOrder: 0 },
  { slug: 'sacred-blessings', name: 'Sacred Blessings', status: CollectionStatus.ACTIVA, sortOrder: 1 },
  { slug: 'legends-of-war', name: 'Legends of War', status: CollectionStatus.PROXIMA, sortOrder: 2 },
  { slug: 'top-sports', name: 'Top Sports', status: CollectionStatus.PROXIMA, sortOrder: 3 },
];

// FAQ inicial (editable desde admin).
const FAQS: { question: string; answer: string }[] = [
  { question: '¿La reserva me asigna número de socio?', answer: 'No. El número de socio solo se asigna con el pago completo de la membresía. El importe de la reserva se descuenta del total.' },
  { question: '¿Puedo elegir o cambiar de club al pagar?', answer: 'Sí. La reserva es genérica; eliges o confirmas tu club (Prime o Prestige) al completar el pago.' },
  { question: '¿Cuándo recibiré mis piezas?', answer: 'Cada pieza tiene su fecha de producción y envío. Verás el estado de cada producto en tu cuenta; las Mystery Boxes se envían cuando recibimos y validamos la mercancía.' },
  { question: '¿Los productos son una inversión?', answer: 'No. Los productos Legacy Fan son artículos coleccionables. No constituyen producto financiero ni promesa de rentabilidad futura.' },
  { question: '¿Cómo funcionan los puntos?', answer: 'Acumulas saldo interno sobre el premium de tus compras, canjeable en la tienda. La caducidad y el ratio son configurables.' },
];

async function seedFaq() {
  const count = await prisma.faqItem.count();
  if (count > 0) return;
  await prisma.faqItem.createMany({
    data: FAQS.map((f, i) => ({ locale: Locale.es, question: f.question, answer: f.answer, sortOrder: i })),
  });
}

async function seedCollections() {
  for (const c of COLLECTIONS) {
    await prisma.collection.upsert({
      where: { slug: c.slug },
      update: { name: c.name },
      create: { slug: c.slug, name: c.name, status: c.status, sortOrder: c.sortOrder },
    });
  }
}

async function seedEmailTemplates() {
  for (const tpl of EMAIL_TEMPLATES) {
    const template = await prisma.emailTemplate.upsert({
      where: { key: tpl.key },
      update: {},
      create: { key: tpl.key },
    });
    for (const locale of [Locale.es, Locale.en] as const) {
      const t = tpl[locale];
      await prisma.emailTemplateTranslation.upsert({
        where: { templateId_locale: { templateId: template.id, locale } },
        update: {},
        create: { templateId: template.id, locale, subject: t.subject, body: t.body },
      });
    }
  }
}

async function main() {
  await seedRoles();
  await seedPlan(ClubType.PRIME, 'prime-club', 'Legacy Prime Club', PRIME_PHASES);
  await seedPlan(ClubType.PRESTIGE, 'prestige-club', 'Legacy Prestige Club', PRESTIGE_PHASES);
  await seedSettings();
  await seedReservedMemberNumbers();
  await seedLegalDisclaimer();
  await seedLegalPages();
  await seedEmailTemplates();
  await seedCollections();
  await seedFaq();
  // Silencio en producción; útil en local.
  void ReferralRewardMode;
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
