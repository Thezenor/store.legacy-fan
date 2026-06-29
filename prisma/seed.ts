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
  { key: 'fiscal.company_name', group: 'fiscal', value: 'Legacy Fan' },
  { key: 'fiscal.base_country', group: 'fiscal', value: 'ES' },
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
  // 1–100 reservados a asignación manual (doc 04). Idempotente.
  const existing = await prisma.memberNumber.count({ where: { isReserved: true } });
  if (existing >= 100) return;
  const data = [];
  for (let n = 1; n <= 100; n++) {
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

async function main() {
  await seedRoles();
  await seedPlan(ClubType.PRIME, 'prime-club', 'Legacy Prime Club', PRIME_PHASES);
  await seedPlan(ClubType.PRESTIGE, 'prestige-club', 'Legacy Prestige Club', PRESTIGE_PHASES);
  await seedSettings();
  await seedReservedMemberNumbers();
  await seedLegalDisclaimer();
  await seedLegalPages();
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
