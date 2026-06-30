'use server';

import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import type {
  ClubType,
  CollectionStatus,
  Locale,
  MemberStatus,
  OrderItemStatus,
} from '@prisma/client';
import { prisma } from './prisma';
import { getAdminSession } from './admin';
import { ensureReferralCode } from './referrals/code';
import { sendTemplatedEmail } from './email/templates';
import { saveUpload } from './storage';

// Lee campos opcionales de ficha técnica del producto desde un formulario.
function productSpecFields(formData: FormData) {
  const intOrNull = (v: FormDataEntryValue | null) => {
    const n = parseInt(String(v ?? ''), 10);
    return Number.isFinite(n) ? n : null;
  };
  return {
    description: String(formData.get('description') ?? '') || null,
    history: String(formData.get('history') ?? '') || null,
    metal: String(formData.get('metal') ?? '') || null,
    weightLabel: String(formData.get('weightLabel') ?? '') || null,
    finish: String(formData.get('finish') ?? '') || null,
    diameter: String(formData.get('diameter') ?? '') || null,
    editionSize: intOrNull(formData.get('editionSize')),
    mintYear: intOrNull(formData.get('mintYear')),
    priceEurCents: eurosToCents(formData.get('priceEur')),
    priceUsdCents: eurosToCents(formData.get('priceUsd')),
    premiumEurCents: eurosToCents(formData.get('premiumEur')),
    premiumUsdCents: eurosToCents(formData.get('premiumUsd')),
    includedInPrime: formData.get('includedInPrime') === 'on',
    includedInPrestige: formData.get('includedInPrestige') === 'on',
    isInauguralCoin: formData.get('isInauguralCoin') === 'on',
    certificateRequired: formData.get('certificateRequired') === 'on',
    hasAuthenticityQr: formData.get('hasAuthenticityQr') === 'on',
    available: formData.get('available') === 'on',
    visible: formData.get('visible') === 'on',
  };
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

async function ensureAdmin() {
  const ok = await getAdminSession();
  if (!ok) throw new Error('No autorizado');
  return ok.session.user;
}

async function audit(
  actorId: string,
  actorEmail: string | null | undefined,
  action: string,
  entity: string,
  entityId: string,
  oldValue: unknown,
  newValue: unknown,
  reason?: string | null,
) {
  await prisma.auditLog.create({
    data: {
      actorId,
      actorEmail: actorEmail ?? null,
      action,
      entity,
      entityId,
      oldValue: oldValue as object,
      newValue: newValue as object,
      reason: reason ?? null,
    },
  });
}

const eurosToCents = (v: FormDataEntryValue | null) =>
  Math.max(0, Math.round(parseFloat(String(v ?? '0').replace(',', '.')) * 100) || 0);

/** Edita precios y estado de una fase (doc 09). */
export async function updatePhaseAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const id = String(formData.get('phaseId'));
  const before = await prisma.membershipPhase.findUnique({ where: { id } });
  if (!before) return;

  const data = {
    priceEurCents: eurosToCents(formData.get('priceEur')),
    priceUsdCents: eurosToCents(formData.get('priceUsd')),
    isActive: formData.get('isActive') === 'on',
    forcedState: formData.get('forcedState') === 'on',
  };
  await prisma.membershipPhase.update({ where: { id }, data });
  await audit(admin.id, admin.email, 'phase.update', 'MembershipPhase', id, before, data);
  revalidatePath('/lf-admin/fases');
}

/** Edita un ajuste del sistema (valor JSON). */
export async function updateSettingAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const key = String(formData.get('key'));
  const raw = String(formData.get('value') ?? '');
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    value = raw; // si no es JSON válido, se guarda como string
  }
  const before = await prisma.systemSetting.findUnique({ where: { key } });
  await prisma.systemSetting.update({ where: { key }, data: { value: value as object } });
  await audit(admin.id, admin.email, 'setting.update', 'SystemSetting', key, before?.value, value);
  revalidatePath('/lf-admin/ajustes');
}

/** Edita una página legal (título y cuerpo). */
export async function updateLegalAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const slug = String(formData.get('slug'));
  const locale = String(formData.get('locale')) as Locale;
  const title = String(formData.get('title') ?? '');
  const body = String(formData.get('body') ?? '');
  await prisma.legalPage.update({
    where: { slug_locale: { slug, locale } },
    data: { title, body },
  });
  await audit(admin.id, admin.email, 'legal.update', 'LegalPage', `${slug}/${locale}`, null, { title });
  revalidatePath('/lf-admin/legal');
  revalidatePath(`/legal/${slug}`);
}

/** Crea una colección (doc 05). */
export async function createCollectionAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const name = String(formData.get('name') ?? '').trim();
  if (!name) return;
  const slug = (String(formData.get('slug') ?? '').trim() || slugify(name));
  const status = (String(formData.get('status') ?? 'BORRADOR')) as CollectionStatus;
  const created = await prisma.collection.create({ data: { name, slug, status } });
  await audit(admin.id, admin.email, 'collection.create', 'Collection', created.id, null, { name, slug, status });
  revalidatePath('/lf-admin/colecciones');
}

/** Actualiza el estado de una colección. */
export async function updateCollectionAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const id = String(formData.get('id'));
  const status = String(formData.get('status')) as CollectionStatus;
  await prisma.collection.update({ where: { id }, data: { status } });
  await audit(admin.id, admin.email, 'collection.update', 'Collection', id, null, { status });
  revalidatePath('/lf-admin/colecciones');
}

/** Crea un producto con los campos clave (doc 05). */
export async function createProductAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const name = String(formData.get('name') ?? '').trim();
  if (!name) return;
  const slug = String(formData.get('slug') ?? '').trim() || slugify(name);
  const collectionId = String(formData.get('collectionId') ?? '') || null;
  const created = await prisma.product.create({
    data: { name, slug, collectionId, ...productSpecFields(formData) },
  });
  await audit(admin.id, admin.email, 'product.create', 'Product', created.id, null, { name, slug });
  revalidatePath('/lf-admin/productos');
}

/** Actualiza un producto existente. */
export async function updateProductAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const id = String(formData.get('id'));
  const before = await prisma.product.findUnique({ where: { id } });
  if (!before) return;
  const name = String(formData.get('name') ?? '').trim();
  const collectionId = String(formData.get('collectionId') ?? '') || null;
  await prisma.product.update({
    where: { id },
    data: {
      ...(name ? { name } : {}),
      collectionId,
      ...productSpecFields(formData),
    },
  });
  await audit(admin.id, admin.email, 'product.update', 'Product', id, null, { id });
  revalidatePath('/lf-admin/productos');
  revalidatePath(`/lf-admin/productos/${id}`);
}

/** Sube una imagen y la asocia al producto (galería). */
export async function uploadProductImageAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const productId = String(formData.get('productId'));
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return;
  const { url } = await saveUpload(file);
  const count = await prisma.productImage.count({ where: { productId } });
  await prisma.productImage.create({
    data: { productId, url, alt: String(formData.get('alt') ?? '') || null, sortOrder: count },
  });
  await audit(admin.id, admin.email, 'product.image_add', 'Product', productId, null, { url });
  revalidatePath(`/lf-admin/productos/${productId}`);
}

export async function deleteProductImageAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const id = String(formData.get('imageId'));
  const img = await prisma.productImage.findUnique({ where: { id } });
  if (!img) return;
  await prisma.productImage.delete({ where: { id } });
  await audit(admin.id, admin.email, 'product.image_delete', 'ProductImage', id, null, null);
  revalidatePath(`/lf-admin/productos/${img.productId}`);
}

export type ManualMemberResult =
  | { ok: true; number: string }
  | { ok: false; error: string };

/**
 * Crea un socio manualmente (doc 04/09) asignando un número reservado 1–100 a
 * un usuario ya registrado. Atómico y auditado.
 */
export async function createManualMemberAction(
  _prev: ManualMemberResult | null,
  formData: FormData,
): Promise<ManualMemberResult> {
  const admin = await ensureAdmin();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const club = String(formData.get('club') ?? 'PRIME') as ClubType;
  const num = parseInt(String(formData.get('number') ?? ''), 10);
  const observations = String(formData.get('observations') ?? '') || null;

  if (!email || !Number.isInteger(num) || num < 1 || num > 100) {
    return { ok: false, error: 'Datos inválidos (email y número 1–100).' };
  }

  const user = await prisma.user.findUnique({ where: { email }, include: { membership: true } });
  if (!user) return { ok: false, error: 'No existe un usuario con ese email.' };
  if (user.membership) return { ok: false, error: 'El usuario ya tiene membresía.' };

  const memberNumber = await prisma.memberNumber.findUnique({ where: { number: num } });
  if (!memberNumber) return { ok: false, error: 'Número no encontrado.' };
  if (memberNumber.membershipId) return { ok: false, error: 'Ese número ya está asignado.' };
  if (memberNumber.isBlocked) return { ok: false, error: 'Ese número está bloqueado.' };

  const now = new Date();
  const end = new Date(now);
  end.setFullYear(end.getFullYear() + 1);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const membership = await tx.membership.create({
        data: { userId: user.id, club, status: 'SOCIO_ACTIVO', startsAt: now, endsAt: end },
      });
      await tx.memberNumber.update({
        where: { number: num },
        data: { membershipId: membership.id, assignedAt: now },
      });
      await ensureReferralCode(tx, user.id);
      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          actorEmail: admin.email,
          action: 'member.manual_create',
          entity: 'Membership',
          entityId: membership.id,
          newValue: { email, club, number: memberNumber.formatted },
          reason: observations,
        },
      });
      return memberNumber.formatted;
    });
    revalidatePath('/lf-admin/socios');
    return { ok: true, number: result };
  } catch {
    return { ok: false, error: 'No se pudo crear el socio.' };
  }
}

/** Edita una traducción de plantilla de email + estado activo del template. */
export async function updateEmailTemplateAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const templateId = String(formData.get('templateId'));
  const locale = String(formData.get('locale')) as Locale;
  const subject = String(formData.get('subject') ?? '');
  const body = String(formData.get('body') ?? '');
  const active = formData.get('active') === 'on';

  await prisma.emailTemplateTranslation.update({
    where: { templateId_locale: { templateId, locale } },
    data: { subject, body },
  });
  await prisma.emailTemplate.update({ where: { id: templateId }, data: { active } });
  await audit(admin.id, admin.email, 'email_template.update', 'EmailTemplate', `${templateId}/${locale}`, null, { subject, active });
  revalidatePath('/lf-admin/emails');
}

/** Envía un email de prueba de una plantilla al email del admin. */
export async function sendTestEmailAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const key = String(formData.get('key'));
  const locale = (String(formData.get('locale')) || 'es') as Locale;
  await sendTemplatedEmail(key, admin.email ?? 'admin@example.com', locale, {
    firstName: 'Demo',
    amount: '50,00 €',
    memberNumber: 'LF-000123',
    deadline: '31/12/2026',
  });
  await audit(admin.id, admin.email, 'email_template.test_send', 'EmailTemplate', key, null, { to: admin.email });
  revalidatePath('/lf-admin/emails');
}

/** Bloquea o desbloquea un usuario (doc 09). */
export async function toggleUserBlockAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const userId = String(formData.get('userId'));
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;
  await prisma.user.update({ where: { id: userId }, data: { isBlocked: !user.isBlocked } });
  await audit(admin.id, admin.email, 'user.block_toggle', 'User', userId, { isBlocked: user.isBlocked }, { isBlocked: !user.isBlocked });
  revalidatePath('/lf-admin/socios');
}

// ───────────────── Socio: editar membresía / puntos / contraseña ─────────────────

/** Cambia club y/o estado de la membresía (doc 09). */
export async function updateMembershipAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const id = String(formData.get('membershipId'));
  const club = String(formData.get('club')) as ClubType;
  const status = String(formData.get('status')) as MemberStatus;
  const observations = String(formData.get('observations') ?? '') || null;
  await prisma.membership.update({ where: { id }, data: { club, status } });
  await audit(admin.id, admin.email, 'membership.update', 'Membership', id, null, { club, status }, observations);
  revalidatePath(`/lf-admin/socios`);
}

/** Ajuste manual de saldo/puntos (positivo o negativo) con transacción auditada. */
export async function adjustPointsAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const userId = String(formData.get('userId'));
  const cents = Math.round(parseFloat(String(formData.get('amount') ?? '0').replace(',', '.')) * 100);
  const reason = String(formData.get('reason') ?? 'Ajuste manual del admin');
  if (!cents) return;
  const wallet = await prisma.pointsWallet.upsert({
    where: { userId },
    update: { balanceCents: { increment: cents } },
    create: { userId, balanceCents: cents, pendingCents: 0 },
  });
  await prisma.pointsTransaction.create({
    data: { walletId: wallet.id, type: 'ADMIN_ADJUST', amountCents: cents, reason },
  });
  await audit(admin.id, admin.email, 'points.adjust', 'PointsWallet', wallet.id, null, { cents, reason });
  revalidatePath('/lf-admin/socios');
}

/** Restablece la contraseña de un usuario (doc 09). */
export async function resetUserPasswordAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const userId = String(formData.get('userId'));
  const password = String(formData.get('password') ?? '');
  if (password.length < 8) return;
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  await audit(admin.id, admin.email, 'user.password_reset', 'User', userId, null, { byAdmin: true });
  revalidatePath('/lf-admin/socios');
}

// ───────────────── Pagos: reembolso ─────────────────

/** Marca un pago como reembolsado (estado interno + auditoría). La devolución
 * real en PayPal requiere credenciales/API y se hará al activar la pasarela. */
export async function refundPaymentAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const id = String(formData.get('paymentId'));
  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment || payment.status === 'REEMBOLSADO') return;
  await prisma.payment.update({ where: { id }, data: { status: 'REEMBOLSADO' } });
  if (payment.reservationId) {
    await prisma.reservation.update({ where: { id: payment.reservationId }, data: { status: 'REEMBOLSADO' } });
  }
  await audit(admin.id, admin.email, 'payment.refund', 'Payment', id, { status: payment.status }, { status: 'REEMBOLSADO' });
  revalidatePath('/lf-admin/pagos');
}

// ───────────────── Roles ─────────────────

/** Asigna un rol a un usuario por email (doc 09). */
export async function assignRoleAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const roleKey = String(formData.get('roleKey') ?? '');
  const user = await prisma.user.findUnique({ where: { email } });
  const role = await prisma.role.findUnique({ where: { key: roleKey } });
  if (!user || !role) return;
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    update: {},
    create: { userId: user.id, roleId: role.id },
  });
  await audit(admin.id, admin.email, 'role.assign', 'UserRole', `${user.id}/${role.id}`, null, { email, roleKey });
  revalidatePath('/lf-admin/roles');
}

export async function removeRoleAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const userId = String(formData.get('userId'));
  const roleId = String(formData.get('roleId'));
  await prisma.userRole.delete({ where: { userId_roleId: { userId, roleId } } }).catch(() => {});
  await audit(admin.id, admin.email, 'role.remove', 'UserRole', `${userId}/${roleId}`, null, null);
  revalidatePath('/lf-admin/roles');
}

// ───────────────── FAQ ─────────────────

export async function upsertFaqAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const id = String(formData.get('id') ?? '');
  const locale = String(formData.get('locale') ?? 'es') as Locale;
  const question = String(formData.get('question') ?? '');
  const answer = String(formData.get('answer') ?? '');
  if (!question) return;
  if (id) {
    await prisma.faqItem.update({ where: { id }, data: { question, answer, locale } });
  } else {
    await prisma.faqItem.create({ data: { question, answer, locale } });
  }
  await audit(admin.id, admin.email, 'faq.upsert', 'FaqItem', id || 'new', null, { question });
  revalidatePath('/lf-admin/faq');
}

export async function deleteFaqAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const id = String(formData.get('id'));
  await prisma.faqItem.delete({ where: { id } }).catch(() => {});
  await audit(admin.id, admin.email, 'faq.delete', 'FaqItem', id, null, null);
  revalidatePath('/lf-admin/faq');
}

// ───────────────── SEO / GEO ─────────────────

export async function upsertSeoAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const path = String(formData.get('path') ?? '').trim();
  const locale = String(formData.get('locale') ?? 'es') as Locale;
  if (!path) return;
  const data = {
    title: String(formData.get('title') ?? '') || null,
    description: String(formData.get('description') ?? '') || null,
    keywords: String(formData.get('keywords') ?? '') || null,
  };
  await prisma.seoMetadata.upsert({
    where: { path_locale: { path, locale } },
    update: data,
    create: { path, locale, ...data },
  });
  await audit(admin.id, admin.email, 'seo.upsert', 'SeoMetadata', `${path}/${locale}`, null, data);
  revalidatePath('/lf-admin/seo');
}

// ───────────────── Pedidos / envíos ─────────────────

/** Cambia el estado logístico de un item de pedido (doc 07). */
export async function updateOrderItemStatusAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const id = String(formData.get('itemId'));
  const status = String(formData.get('status')) as OrderItemStatus;
  await prisma.orderItem.update({ where: { id }, data: { status } });
  await audit(admin.id, admin.email, 'order_item.status', 'OrderItem', id, null, { status });
  revalidatePath('/lf-admin/pedidos');
}

// ───────────────── Configuración del sistema (panel agrupado) ─────────────────

// Mapa de campos del panel de configuración: clave → tipo de coerción.
const CONFIG_FIELDS: { key: string; type: 'string' | 'number' | 'bool' | 'money' | 'date' }[] = [
  { key: 'fiscal.company_name', type: 'string' },
  { key: 'fiscal.base_country', type: 'string' },
  { key: 'fiscal.base_currency', type: 'string' },
  { key: 'fiscal.invoice_series', type: 'string' },
  { key: 'launch.date', type: 'date' },
  // payments.*.enabled se gestionan en la sección Pasarelas (saveGatewayAction).
  { key: 'payments.mode', type: 'string' },
  { key: 'reservation.amount.eur', type: 'money' },
  { key: 'reservation.amount.usd', type: 'money' },
  { key: 'reservation.grace_days_after_launch', type: 'number' },
  { key: 'reservation.refundable_hours_before_launch', type: 'number' },
  { key: 'points.ratio_per_currency_unit', type: 'number' },
  { key: 'points.expiry_years', type: 'number' },
  { key: 'upsell.second_coin.enabled_prime', type: 'bool' },
  { key: 'upsell.second_coin.enabled_prestige', type: 'bool' },
  { key: 'system.maintenance_mode', type: 'bool' },
];

/** Guarda todo el panel de configuración de una vez (doc 09). */
export async function saveConfigAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  for (const f of CONFIG_FIELDS) {
    const raw = formData.get(f.key);
    let value: unknown;
    switch (f.type) {
      case 'bool':
        value = raw === 'on';
        break;
      case 'number':
        value = Math.round(Number(raw ?? 0)) || 0;
        break;
      case 'money':
        value = Math.round(parseFloat(String(raw ?? '0').replace(',', '.')) * 100) || 0;
        break;
      case 'date':
        value = raw ? new Date(String(raw)).toISOString() : null;
        break;
      default:
        value = String(raw ?? '');
    }
    await prisma.systemSetting.upsert({
      where: { key: f.key },
      update: { value: value as object },
      create: { key: f.key, value: value as object, group: f.key.split('.')[0] },
    });
  }
  await audit(admin.id, admin.email, 'config.save', 'SystemSetting', 'panel', null, { fields: CONFIG_FIELDS.length });
  revalidatePath('/lf-admin/config');
}

/** Edita los datos personales/envío de un socio (doc 09). */
export async function updateProfileAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const userId = String(formData.get('userId'));
  const s = (k: string) => String(formData.get(k) ?? '') || null;
  await prisma.userProfile.update({
    where: { userId },
    data: {
      firstName: String(formData.get('firstName') ?? '').trim() || 'Socio',
      lastName: String(formData.get('lastName') ?? '').trim() || '',
      phone: s('phone'),
      country: s('country'),
      addressLine1: s('addressLine1'),
      addressLine2: s('addressLine2'),
      city: s('city'),
      postalCode: s('postalCode'),
    },
  });
  await audit(admin.id, admin.email, 'profile.update', 'UserProfile', userId, null, { byAdmin: true });
  revalidatePath('/lf-admin/socios');
}

// ───────────────── Colecciones: imagen + asignar productos ─────────────────

export async function uploadCollectionImageAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const id = String(formData.get('collectionId'));
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return;
  const { url } = await saveUpload(file);
  await prisma.collection.update({ where: { id }, data: { imageUrl: url } });
  await audit(admin.id, admin.email, 'collection.image', 'Collection', id, null, { url });
  revalidatePath('/lf-admin/colecciones');
}

/** Asigna (o quita) un producto a una colección. */
export async function assignProductCollectionAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const productId = String(formData.get('productId'));
  const collectionId = String(formData.get('collectionId') ?? '') || null;
  await prisma.product.update({ where: { id: productId }, data: { collectionId } });
  await audit(admin.id, admin.email, 'product.assign_collection', 'Product', productId, null, { collectionId });
  revalidatePath('/lf-admin/colecciones');
  revalidatePath(`/lf-admin/productos/${productId}`);
}

// ───────────────── Producto: vídeo + toggles rápidos ─────────────────

export async function uploadProductVideoAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const productId = String(formData.get('productId'));
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return;
  const { url } = await saveUpload(file);
  await prisma.product.update({ where: { id: productId }, data: { videoUrl: url } });
  await audit(admin.id, admin.email, 'product.video', 'Product', productId, null, { url });
  revalidatePath(`/lf-admin/productos/${productId}`);
}

/** Toggle rápido de visible/available desde la lista de productos. */
export async function toggleProductFlagAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const id = String(formData.get('id'));
  const field = String(formData.get('field')); // 'visible' | 'available'
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || (field !== 'visible' && field !== 'available')) return;
  await prisma.product.update({ where: { id }, data: { [field]: !product[field] } });
  await audit(admin.id, admin.email, 'product.toggle', 'Product', id, null, { field });
  revalidatePath('/lf-admin/productos');
}

// ───────────────── Pasarelas de pago (credenciales en BD) ─────────────────

/** Guarda la configuración de una pasarela (credenciales + activo). */
export async function saveGatewayAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const gateway = String(formData.get('gateway')); // 'paypal' | 'stripe'
  const fields = gateway === 'stripe'
    ? ['stripe.secret_key', 'stripe.publishable_key', 'stripe.webhook_secret']
    : ['paypal.client_id', 'paypal.client_secret', 'paypal.webhook_id', 'paypal.mode'];
  for (const key of fields) {
    const value = String(formData.get(key) ?? '');
    await prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value, group: 'payments' },
    });
  }
  const enabledKey = gateway === 'stripe' ? 'payments.stripe.enabled' : 'payments.paypal.enabled';
  await prisma.systemSetting.upsert({
    where: { key: enabledKey },
    update: { value: formData.get('enabled') === 'on' },
    create: { key: enabledKey, value: formData.get('enabled') === 'on', group: 'payments' },
  });
  await audit(admin.id, admin.email, 'gateway.save', 'SystemSetting', gateway, null, { gateway });
  revalidatePath('/lf-admin/config');
}

/** Edita un club: nombre, tagline, activo, lanzamiento y reserva propios. */
export async function updateClubAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const id = String(formData.get('id'));
  const eur = String(formData.get('reservationEur') ?? '').trim();
  const usd = String(formData.get('reservationUsd') ?? '').trim();
  const launch = String(formData.get('launchDate') ?? '').trim();
  const data = {
    name: String(formData.get('name') ?? '').trim() || undefined,
    tagline: String(formData.get('tagline') ?? '') || null,
    active: formData.get('active') === 'on',
    launchDate: launch ? new Date(launch) : null,
    reservationEurCents: eur ? Math.round(parseFloat(eur.replace(',', '.')) * 100) : null,
    reservationUsdCents: usd ? Math.round(parseFloat(usd.replace(',', '.')) * 100) : null,
  };
  await prisma.membershipPlan.update({ where: { id }, data });
  await audit(admin.id, admin.email, 'club.update', 'MembershipPlan', id, null, { name: data.name, active: data.active });
  revalidatePath('/lf-admin/clubs');
  revalidatePath('/club');
  revalidatePath('/club/prime');
  revalidatePath('/club/prestige');
}

/** Bloquea/desbloquea un número de socio (doc 04). */
export async function toggleMemberNumberBlockAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const id = String(formData.get('id'));
  const mn = await prisma.memberNumber.findUnique({ where: { id } });
  if (!mn || mn.membershipId) return; // no bloquear números ya asignados
  await prisma.memberNumber.update({ where: { id }, data: { isBlocked: !mn.isBlocked } });
  await audit(admin.id, admin.email, 'member_number.block_toggle', 'MemberNumber', id, { isBlocked: mn.isBlocked }, { isBlocked: !mn.isBlocked });
  revalidatePath('/lf-admin/numeracion');
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const id = String(formData.get('id'));
  await prisma.product.delete({ where: { id } }).catch(() => {});
  await audit(admin.id, admin.email, 'product.delete', 'Product', id, null, null);
  revalidatePath('/lf-admin/productos');
}

export async function deleteCollectionAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const id = String(formData.get('id'));
  // Evita borrar colecciones con productos (integridad).
  const count = await prisma.product.count({ where: { collectionId: id } });
  if (count > 0) return;
  await prisma.collection.delete({ where: { id } }).catch(() => {});
  await audit(admin.id, admin.email, 'collection.delete', 'Collection', id, null, null);
  revalidatePath('/lf-admin/colecciones');
}

/** Crea un envío con tracking para un pedido y marca sus items como enviados. */
export async function createShipmentAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const orderId = String(formData.get('orderId'));
  const carrier = String(formData.get('carrier') ?? '') || null;
  const trackingCode = String(formData.get('tracking') ?? '') || null;
  await prisma.shipment.create({
    data: { orderId, carrier, trackingCode, status: 'ENVIADO', shippedAt: new Date() },
  });
  await prisma.orderItem.updateMany({ where: { orderId }, data: { status: 'ENVIADO' } });
  await audit(admin.id, admin.email, 'shipment.create', 'Order', orderId, null, { carrier, trackingCode });
  revalidatePath('/lf-admin/pedidos');
}
