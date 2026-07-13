'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import type {
  AmbassadorModel,
  AmbassadorPayout,
  AmbassadorStatus,
  ClubType,
  CollectionStatus,
  Currency,
  Locale,
  MemberStatus,
  OrderItemStatus,
} from '@prisma/client';
import { prisma } from './prisma';
import { getAdminSession } from './admin';
import { ensureReferralCode } from './referrals/code';
import { sendTemplatedEmail, emailShell } from './email/templates';
import { getEmailProvider } from './email';
import { randomBytes } from 'node:crypto';
import { saveUpload, optimizeImageToDataUri } from './storage';
import { getSubscriptionProviderForAdmin, testGatewayConnection } from './payments';
import { getClubPricing, getPlan } from './commerce';
import { emailVerification } from './tokens';
import { generatePassSecret } from './members/pass-token';
import { assignMemberNumber } from './members/numbering';
import { activateMembershipTx, reserveMembershipTx } from './members/membership';
import { ambassadorCodeFromName, normalizeCode } from './ambassador/codes';
import { AMBASSADOR_DEFAULTS } from './ambassador/config';
import { createIncludedOrder } from './members/order';
import { createInvoice } from './members/invoice';
import { getClubLaunchDate } from './commerce/phases';
import { sendVerificationEmail } from './email/auth-emails';

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
    // Atributos de moneda (complementos de la pieza)
    productType: String(formData.get('productType') ?? '') || null,
    purity: String(formData.get('purity') ?? '') || null,
    limitedEdition: formData.get('limitedEdition') === 'on',
    totalUnits: intOrNull(formData.get('totalUnits')),
    specialLabel: String(formData.get('specialLabel') ?? '') || null,
    ipLicense: String(formData.get('ipLicense') ?? '') || null,
    features: linesToArray(formData.get('features')),
    country: String(formData.get('country') ?? '') || null,
    faceValue: String(formData.get('faceValue') ?? '') || null,
    quality: String(formData.get('quality') ?? '') || null,
    coa: String(formData.get('coa') ?? '') || null,
    boxInfo: String(formData.get('boxInfo') ?? '') || null,
    capsule: String(formData.get('capsule') ?? '') || null,
    coinFeatures: formData.getAll('coinFeatures').map((v) => String(v)).filter(Boolean),
  };
}

/** Convierte un textarea (una línea = un ítem) en array, sin vacíos. */
function linesToArray(v: FormDataEntryValue | null): string[] {
  return String(v ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
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
  const isSecret = formData.get('secret') === '1';
  // Secreto con campo vacío = conservar el valor guardado (el panel no lo muestra).
  if (isSecret && raw.trim() === '') return;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    value = raw; // si no es JSON válido, se guarda como string
  }
  const before = await prisma.systemSetting.findUnique({ where: { key } });
  await prisma.systemSetting.update({ where: { key }, data: { value: value as object } });
  // Nunca escribir valores secretos en el log de auditoría.
  await audit(
    admin.id,
    admin.email,
    'setting.update',
    'SystemSetting',
    key,
    isSecret ? '[secreto]' : before?.value,
    isSecret ? '[secreto]' : value,
  );
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
// Revalida admin + web pública (todas las locales) al cambiar colecciones.
function revalidateCollections() {
  revalidatePath('/lf-admin/colecciones');
  revalidatePath('/[locale]/colecciones', 'page');
  revalidatePath('/[locale]/colecciones/[slug]', 'page');
  revalidatePath('/[locale]', 'page');
}

export async function createCollectionAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const name = String(formData.get('name') ?? '').trim();
  if (!name) return;
  const slug = (String(formData.get('slug') ?? '').trim() || slugify(name));
  const status = (String(formData.get('status') ?? 'BORRADOR')) as CollectionStatus;
  const created = await prisma.collection.create({ data: { name, slug, status } });
  await audit(admin.id, admin.email, 'collection.create', 'Collection', created.id, null, { name, slug, status });
  revalidateCollections();
}

/** Actualiza el estado de una colección. */
export async function updateCollectionAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const id = String(formData.get('id'));
  const status = String(formData.get('status')) as CollectionStatus;
  // videoUrl es opcional: cadena vacía => se limpia (null).
  const raw = formData.get('videoUrl');
  const data: { status: CollectionStatus; videoUrl?: string | null } = { status };
  if (raw !== null) {
    const v = String(raw).trim();
    data.videoUrl = v || null;
  }
  await prisma.collection.update({ where: { id }, data });
  await audit(admin.id, admin.email, 'collection.update', 'Collection', id, null, { status, videoUrl: data.videoUrl ?? undefined });
  revalidateCollections();
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
  // Vuelve a la lista de productos con aviso de guardado.
  redirect('/lf-admin/productos?saved=1');
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
  redirect('/lf-admin/productos?saved=1');
}

/** Sube una imagen y la asocia al producto (galería). Data URI en BD (no
    depende del Volume; misma solución que monedas/colecciones). */
export async function uploadProductImageAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const productId = String(formData.get('productId'));
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return;
  if (file.size > 15 * 1024 * 1024) throw new Error('La imagen supera 15 MB.');
  const [url, urlMobile] = await Promise.all([
    optimizeImageToDataUri(file, 1200),
    optimizeImageToDataUri(file, 640),
  ]);
  const count = await prisma.productImage.count({ where: { productId } });
  await prisma.productImage.create({
    data: { productId, url, urlMobile, alt: String(formData.get('alt') ?? '') || null, sortOrder: count },
  });
  await audit(admin.id, admin.email, 'product.image_add', 'Product', productId, null, { bytes: file.size });
  revalidatePath(`/lf-admin/productos/${productId}`);
}

/** Edita la traducción (nombre/descripción) de un producto por idioma. Nombre
 * vacío = elimina la traducción (se usará el nombre base). */
export async function updateProductTranslationAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const productId = String(formData.get('productId'));
  const locale = String(formData.get('locale') ?? '') as Locale;
  if (!['es', 'en', 'fr', 'it'].includes(locale)) return;
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim() || null;
  if (!name) {
    await prisma.productTranslation.deleteMany({ where: { productId, locale } });
  } else {
    await prisma.productTranslation.upsert({
      where: { productId_locale: { productId, locale } },
      update: { name, description },
      create: { productId, locale, name, description },
    });
  }
  await audit(admin.id, admin.email, 'product.translation', 'Product', `${productId}/${locale}`, null, { name });
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
 * Crea un socio manualmente (doc 04/09) a un usuario ya registrado. No se elige
 * el número: se asigna el siguiente correlativo libre a partir de LF-000051.
 * Solo se indica la fecha de alta (opcional; por defecto hoy). Atómico y auditado.
 */
export async function createManualMemberAction(
  _prev: ManualMemberResult | null,
  formData: FormData,
): Promise<ManualMemberResult> {
  const admin = await ensureAdmin();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const club = String(formData.get('club') ?? 'PRIME') as ClubType;
  const observations = String(formData.get('observations') ?? '') || null;

  if (!email) return { ok: false, error: 'Indica el email del usuario.' };

  // Fecha de alta: la indicada (yyyy-mm-dd) o ahora. Fija la hora al mediodía
  // para evitar saltos de día por zona horaria.
  const rawDate = String(formData.get('startsAt') ?? '').trim();
  const startsAt = rawDate ? new Date(`${rawDate}T12:00:00`) : new Date();
  if (Number.isNaN(startsAt.getTime())) return { ok: false, error: 'Fecha de alta inválida.' };
  const end = new Date(startsAt);
  end.setFullYear(end.getFullYear() + 1);

  const user = await prisma.user.findUnique({ where: { email }, include: { membership: true } });
  if (!user) return { ok: false, error: 'No existe un usuario con ese email.' };
  if (user.membership) return { ok: false, error: 'El usuario ya tiene membresía.' };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const membership = await tx.membership.create({
        data: { userId: user.id, club, status: 'SOCIO_ACTIVO', startsAt, endsAt: end },
      });
      // Correlativo libre ≥ LF-000051 (misma lógica que el pago completo).
      const number = await assignMemberNumber(tx, membership.id);
      await ensureReferralCode(tx, user.id);
      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          actorEmail: admin.email,
          action: 'member.manual_create',
          entity: 'Membership',
          entityId: membership.id,
          newValue: { email, club, number: number.formatted, startsAt: startsAt.toISOString() },
          reason: observations,
        },
      });
      return number.formatted;
    });
    revalidatePath('/lf-admin/socios');
    return { ok: true, number: result };
  } catch {
    return { ok: false, error: 'No se pudo crear el socio.' };
  }
}

/**
 * Registra un PAGO MANUAL (cobro fuera de pasarela) sobre un socio/usuario:
 *  - kind 'reserve' → cobra la reserva: asigna número y deja la membresía en
 *    RESERVA_PENDIENTE (NO activa al socio).
 *  - kind 'full'    → cobra el total: ACTIVA al socio (SOCIO_ACTIVO), número,
 *    pedido con productos incluidos y factura.
 * Queda marcado como MANUAL con un id propio (MP-...), quién lo hizo y el motivo.
 */
export async function addManualPaymentAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const userId = String(formData.get('userId') ?? '');
  const membershipId = String(formData.get('membershipId') ?? '');
  const kind = String(formData.get('kind') ?? 'reserve') === 'full' ? 'full' : 'reserve';
  const club = (String(formData.get('club') ?? 'PRIME') || 'PRIME') as ClubType;
  const currency = (String(formData.get('currency') ?? 'EUR') === 'USD' ? 'USD' : 'EUR') as Currency;
  const reason = String(formData.get('reason') ?? '').trim() || null;
  const amountCents = Math.round(parseFloat(String(formData.get('amount') ?? '0').replace(',', '.')) * 100);
  const back = membershipId ? `/lf-admin/socios/${membershipId}` : '/lf-admin/socios';
  if (!userId || !Number.isFinite(amountCents) || amountCents <= 0) redirect(`${back}?payerror=datos`);

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) redirect(`${back}?payerror=nouser`);

  // Identificador propio del cobro manual (visible como referencia).
  const manualRef = `MP-${new Date().getFullYear()}-${randomBytes(4).toString('hex').toUpperCase()}`;
  const rawPayload = { manual: true, adminId: admin.id, adminEmail: admin.email, reason, kind } as const;
  const launchDate = await getClubLaunchDate(club);

  let okRef: string | null = null;
  let errMsg = '';
  try {
    await prisma.$transaction(
      async (tx) => {
        // Reserva ÚNICA por usuario (restricción en BD): se reutiliza o se crea.
        const existing = await tx.reservation.findFirst({ where: { userId } });
        const resData =
          kind === 'full'
            ? { type: 'PAGO_COMPLETO' as const, club, status: 'PAGO_COMPLETO' as const, currency, amountPaidCents: amountCents, totalDueCents: amountCents }
            : { type: 'RESERVA' as const, club, status: 'RESERVA_PENDIENTE' as const, currency, amountPaidCents: amountCents, totalDueCents: amountCents };
        const reservation = existing
          ? await tx.reservation.update({ where: { id: existing.id }, data: resData })
          : await tx.reservation.create({ data: { userId, ...resData } });

        const payment = await tx.payment.create({
          data: {
            userId, reservationId: reservation.id, provider: 'MANUAL', mode: 'LIVE',
            status: 'PAGO_COMPLETO', currency, amountCents, providerRef: manualRef, rawPayload: rawPayload as object,
          },
        });

        if (kind === 'full') {
          // Activa: club definitivo + número de socio.
          await activateMembershipTx(tx, userId, club, launchDate);
          // Pedido con productos incluidos (Order.reservationId es único: evitar duplicado).
          const hasOrder = await tx.order.findUnique({ where: { reservationId: reservation.id }, select: { id: true } });
          if (!hasOrder) await createIncludedOrder(tx, { userId, club, currency, reservationId: reservation.id });
          await createInvoice(tx, { paymentId: payment.id, totalCents: amountCents, currency, year: new Date().getFullYear() });
        } else {
          // Reserva: asigna número, membresía en RESERVA_PENDIENTE (NO activa).
          await reserveMembershipTx(tx, userId, club);
        }

        await tx.auditLog.create({
          data: {
            actorId: admin.id, actorEmail: admin.email,
            action: 'payment.manual_add', entity: 'Payment', entityId: manualRef,
            newValue: { userId, kind, club, currency, amountCents, ref: manualRef },
            reason,
          },
        });
      },
      { maxWait: 15000, timeout: 30000 },
    );
    okRef = manualRef;
  } catch (e) {
    errMsg = e instanceof Error ? e.message : 'error';
    console.error('[payment.manual_add] error:', errMsg);
  }

  revalidatePath('/lf-admin/socios');
  if (membershipId) revalidatePath(`/lf-admin/socios/${membershipId}`);
  if (okRef) redirect(`${back}?paid=${okRef}`);
  redirect(`${back}?payerror=${encodeURIComponent(errMsg).slice(0, 140)}`);
}

/** Elimina una línea de pago (y su factura asociada, por cascada). Para corregir
 *  errores de registro. No revierte activaciones de membresía: si hace falta, se
 *  ajusta el estado del socio aparte. Auditado. */
export async function deletePaymentAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const paymentId = String(formData.get('paymentId') ?? '');
  const membershipId = String(formData.get('membershipId') ?? '');
  const back = membershipId ? `/lf-admin/socios/${membershipId}` : '/lf-admin/socios';
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { id: true, provider: true, amountCents: true, currency: true, providerRef: true },
  });
  if (!payment) redirect(`${back}?payerror=nopago`);
  await prisma.payment.delete({ where: { id: paymentId } }).catch(() => {});
  await audit(admin.id, admin.email, 'payment.delete', 'Payment', paymentId, {
    provider: payment.provider, amountCents: payment.amountCents, currency: payment.currency, ref: payment.providerRef,
  }, null);
  revalidatePath('/lf-admin/socios');
  if (membershipId) revalidatePath(back);
  redirect(`${back}?paydeleted=1`);
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
  revalidatePath('/lf-admin/registros');
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
  revalidatePath('/lf-admin/registros');
}

/** Elimina un usuario y todos sus datos (cascada). No permite admins ni a uno mismo. */
export async function deleteUserAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const userId = String(formData.get('userId'));
  if (!userId || userId === admin.id) return; // no eliminarse a sí mismo
  const target = await prisma.user.findUnique({
    where: { id: userId },
    include: { roles: { include: { role: true } } },
  });
  if (!target) return;
  // Protección: no eliminar administradores/superadmins.
  if (target.roles.some((r) => r.role.key === 'admin' || r.role.key === 'superadmin')) return;
  await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  await audit(admin.id, admin.email, 'user.delete', 'User', userId, { email: target.email }, null);
  revalidatePath('/lf-admin/registros');
  revalidatePath('/lf-admin/socios');
}

/** Reenvía el correo de verificación/registro a un usuario (acción del admin). */
export async function resendRegistrationEmailAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const userId = String(formData.get('userId'));
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });
  if (!user) return;
  const locale = (user.profile?.preferredLocale as 'es' | 'en' | 'fr' | 'it') || 'es';
  const token = await emailVerification.create(user.email);
  await sendVerificationEmail(user.email, locale, token);
  await audit(admin.id, admin.email, 'user.resend_verification', 'User', userId, null, { email: user.email });
  revalidatePath('/lf-admin/registros');
}

/** Alta MANUAL de un cliente (registro sin necesidad de socio) desde el admin. */
export async function createManualUserAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const firstName = String(formData.get('firstName') ?? '').trim();
  const lastName = String(formData.get('lastName') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim() || null;
  const country = (String(formData.get('country') ?? 'ES').trim() || 'ES').toUpperCase().slice(0, 2);
  const rawPassword = String(formData.get('password') ?? '');
  const sendEmail = formData.get('sendEmail') === 'on';
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !firstName || !lastName) return;
  if (await prisma.user.findUnique({ where: { email } })) return; // ya existe

  // Contraseña: la del admin si es válida; si no, una aleatoria (el cliente la resetea).
  const password = rawPassword.length >= 8 ? rawPassword : crypto.randomUUID().replace(/-/g, '') + 'Aa1';
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      profile: {
        create: {
          firstName,
          lastName,
          phone,
          country,
          preferredLocale: 'es',
          preferredCurrency: 'EUR',
          termsAcceptedAt: new Date(),
        },
      },
    },
  });
  if (sendEmail) {
    const token = await emailVerification.create(email);
    await sendVerificationEmail(email, 'es', token);
  }
  await audit(admin.id, admin.email, 'user.manual_create', 'User', user.id, null, { email });
  revalidatePath('/lf-admin/registros');
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

/** Caduca manualmente una reserva pendiente (libera al socio para reintentar). */
export async function expireReservationAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const id = String(formData.get('reservationId'));
  const r = await prisma.reservation.findUnique({ where: { id } });
  if (!r || !['RESERVA_PENDIENTE', 'PENDIENTE_DE_PAGO'].includes(r.status)) return;
  await prisma.reservation.update({ where: { id }, data: { status: 'RESERVA_CADUCADA' } });
  await audit(admin.id, admin.email, 'reservation.expire', 'Reservation', id, { status: r.status }, { status: 'RESERVA_CADUCADA' });
  revalidatePath('/lf-admin/pagos');
}

/** Reembolsa el depósito de una reserva (estado interno + auditoría). La
 * devolución real en PayPal se hará al activar la API de reembolsos. */
export async function refundDepositAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const id = String(formData.get('reservationId'));
  const r = await prisma.reservation.findUnique({ where: { id } });
  if (!r || r.status === 'REEMBOLSADO') return;
  await prisma.reservation.update({ where: { id }, data: { status: 'REEMBOLSADO' } });
  await prisma.payment.updateMany({
    where: { reservationId: id, status: 'PAGO_COMPLETO' },
    data: { status: 'REEMBOLSADO' },
  });
  await audit(admin.id, admin.email, 'reservation.refund_deposit', 'Reservation', id, { status: r.status }, { status: 'REEMBOLSADO' });
  revalidatePath('/lf-admin/pagos');
}

/** Emite el certificado de autenticidad de un artículo del pedido (serial + QR
 * únicos; certificación nominal con el nombre del socio para Prestige).
 * Idempotente (un certificado por artículo). */
export async function issueCertificateAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const itemId = String(formData.get('itemId'));
  const item = await prisma.orderItem.findUnique({
    where: { id: itemId },
    include: {
      certificate: true,
      order: { include: { user: { include: { profile: true } } } },
    },
  });
  if (!item || item.certificate) return; // idempotente
  const year = new Date().getFullYear();
  const serial = `LF-${year}-${randomBytes(4).toString('hex').toUpperCase()}`;
  const qrCode = randomBytes(16).toString('hex');
  const prof = item.order?.user?.profile;
  const nominalName = prof ? `${prof.firstName} ${prof.lastName}`.trim() : null;
  await prisma.certificate.create({ data: { orderItemId: itemId, serial, qrCode, nominalName } });
  await audit(admin.id, admin.email, 'certificate.issue', 'Certificate', itemId, null, { serial });
  revalidatePath(`/lf-admin/pedidos/${item.orderId}`);
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

/** Alta directa de un usuario con rol: email + contraseña + rol, en un paso.
 *  Si el usuario ya existe, solo se le asigna el rol (no se toca su contraseña). */
export async function createUserWithRoleAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const roleKey = String(formData.get('roleKey') ?? '');
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    redirect('/lf-admin/roles?error=email');
  }
  const role = await prisma.role.findUnique({ where: { key: roleKey } });
  if (!role) redirect('/lf-admin/roles?error=rol');

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    if (password.length < 8) redirect('/lf-admin/roles?error=pass');
    const passwordHash = await bcrypt.hash(password, 12);
    const localPart = email.split('@')[0];
    user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        emailVerified: new Date(), // alta manual del admin: cuenta verificada
        profile: {
          create: {
            firstName: localPart,
            lastName: '',
            country: 'ES',
            preferredLocale: 'es',
            preferredCurrency: 'EUR',
            termsAcceptedAt: new Date(),
          },
        },
      },
    });
    await audit(admin.id, admin.email, 'user.create_with_role', 'User', user.id, null, { email, roleKey });
  } else if (password.length >= 8) {
    // Usuario existente: si se indicó contraseña válida, se actualiza.
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  }

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    update: {},
    create: { userId: user.id, roleId: role.id },
  });
  await audit(admin.id, admin.email, 'role.assign', 'UserRole', `${user.id}/${role.id}`, null, { email, roleKey });
  revalidatePath('/lf-admin/roles');
  revalidatePath('/lf-admin/registros');
  redirect('/lf-admin/roles?created=1');
}

export async function removeRoleAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const userId = String(formData.get('userId'));
  const roleId = String(formData.get('roleId'));
  await prisma.userRole.delete({ where: { userId_roleId: { userId, roleId } } }).catch(() => {});
  await audit(admin.id, admin.email, 'role.remove', 'UserRole', `${userId}/${roleId}`, null, null);
  revalidatePath('/lf-admin/roles');
}

// ───────────────── Embajadores (Programa, Bloque 2) ─────────────────

/** Alta de un embajador: genera el código (LEGACY+nombre) y fija reactivación. */
export async function createAmbassadorAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const name = String(formData.get('name') ?? '').trim();
  if (!name) redirect('/lf-admin/embajadores?error=name');

  const typedCode = String(formData.get('code') ?? '').trim();
  let code = typedCode ? normalizeCode(typedCode) : ambassadorCodeFromName(name);
  if (!code.startsWith('LEGACY')) code = 'LEGACY' + code;
  if (code.length < 12 || code.length > 26) redirect('/lf-admin/embajadores?error=codelen');
  if (await prisma.ambassador.findUnique({ where: { code }, select: { id: true } })) {
    redirect(`/lf-admin/embajadores?error=dup&code=${encodeURIComponent(code)}`);
  }

  const model = (['A', 'B', 'C'].includes(String(formData.get('model'))) ? String(formData.get('model')) : 'A') as AmbassadorModel;
  const months = AMBASSADOR_DEFAULTS.reactivateMonths;
  const reactivateBy = new Date();
  reactivateBy.setMonth(reactivateBy.getMonth() + months);

  const amb = await prisma.ambassador.create({
    data: {
      code,
      name,
      channelUrl: String(formData.get('channelUrl') ?? '').trim() || null,
      segment: String(formData.get('segment') ?? '').trim() || null,
      locale: String(formData.get('locale') ?? '').trim() || null,
      model,
      reactivateBy,
    },
  });
  await audit(admin.id, admin.email, 'ambassador.create', 'Ambassador', amb.id, null, { code, name, model });
  redirect(`/lf-admin/embajadores?created=${encodeURIComponent(code)}`);
}

/** Edita un embajador (estado, modelo, cobro, datos fiscales, caducidad, notas). */
export async function updateAmbassadorAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const id = String(formData.get('id') ?? '');
  const get = (k: string) => String(formData.get(k) ?? '').trim();
  const model = (['A', 'B', 'C'].includes(get('model')) ? get('model') : 'A') as AmbassadorModel;
  const status = (['ACTIVO', 'SUSPENDIDO', 'CANCELADO'].includes(get('status')) ? get('status') : 'ACTIVO') as AmbassadorStatus;
  const payoutRaw = get('payoutMethod');
  const payoutMethod = (['PAYPAL', 'TRANSFERENCIA', 'CREDITO'].includes(payoutRaw) ? payoutRaw : null) as AmbassadorPayout | null;
  const reactivateByRaw = get('reactivateBy');

  await prisma.ambassador.update({
    where: { id },
    data: {
      name: get('name') || undefined,
      channelUrl: get('channelUrl') || null,
      segment: get('segment') || null,
      locale: get('locale') || null,
      model,
      status,
      payoutMethod,
      fiscalName: get('fiscalName') || null,
      fiscalId: get('fiscalId') || null,
      fiscalAddress: get('fiscalAddress') || null,
      fiscalCountry: get('fiscalCountry') || null,
      fiscalOk: formData.get('fiscalOk') === 'on',
      reactivateBy: reactivateByRaw ? new Date(`${reactivateByRaw}T12:00:00`) : null,
      notes: get('notes') || null,
    },
  });
  await audit(admin.id, admin.email, 'ambassador.update', 'Ambassador', id, null, { status, model });
  redirect('/lf-admin/embajadores?saved=1');
}

/** Reactiva el código: reinicia la caducidad a hoy + N meses (config). */
export async function reactivateAmbassadorAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const id = String(formData.get('id') ?? '');
  const months = AMBASSADOR_DEFAULTS.reactivateMonths;
  const reactivateBy = new Date();
  reactivateBy.setMonth(reactivateBy.getMonth() + months);
  await prisma.ambassador.update({ where: { id }, data: { reactivatedAt: new Date(), reactivateBy } });
  await audit(admin.id, admin.email, 'ambassador.reactivate', 'Ambassador', id, null, { reactivateBy: reactivateBy.toISOString() });
  redirect('/lf-admin/embajadores?saved=reactivated');
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
  { key: 'fiscal.address', type: 'string' },
  { key: 'fiscal.email', type: 'string' },
  { key: 'fiscal.base_country', type: 'string' },
  { key: 'fiscal.base_currency', type: 'string' },
  { key: 'fiscal.invoice_series', type: 'string' },
  { key: 'launch.date', type: 'date' },
  // payments.*.enabled se gestionan en la sección Pasarelas (saveGatewayAction).
  { key: 'payments.mode', type: 'string' },
  // Modelo de cobro de la membresía: 'one_time' (pago único) o 'subscription' (anual recurrente).
  { key: 'billing.mode', type: 'string' },
  { key: 'reservation.amount.eur', type: 'money' },
  { key: 'reservation.amount.usd', type: 'money' },
  { key: 'reservation.grace_days_after_launch', type: 'number' },
  { key: 'reservation.refundable_hours_before_launch', type: 'number' },
  { key: 'points.ratio_per_currency_unit', type: 'number' },
  { key: 'points.expiry_years', type: 'number' },
  { key: 'upsell.second_coin.enabled_prime', type: 'bool' },
  { key: 'upsell.second_coin.enabled_prestige', type: 'bool' },
  // Upsell 2ª moneda (Prestige): nombres y precios; las imágenes se suben aparte.
  { key: 'upsell.coin.a.name', type: 'string' },
  { key: 'upsell.coin.b.name', type: 'string' },
  { key: 'upsell.second_coin.price_eur', type: 'money' },
  { key: 'upsell.second_coin.price_usd', type: 'money' },
  { key: 'upsell.second_coin.list_eur', type: 'money' },
  { key: 'upsell.second_coin.list_usd', type: 'money' },
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
  if (file.size > 15 * 1024 * 1024) throw new Error('La imagen supera 15 MB.');
  // Data URI en BD (no depende del Volume; misma solución que las monedas):
  // variante escritorio (1000px) + móvil (640px).
  const [url, urlMobile] = await Promise.all([
    optimizeImageToDataUri(file, 1000),
    optimizeImageToDataUri(file, 640),
  ]);
  await prisma.collection.update({ where: { id }, data: { imageUrl: url, imageUrlMobile: urlMobile } });
  await audit(admin.id, admin.email, 'collection.image', 'Collection', id, null, { bytes: file.size });
  revalidateCollections();
}

/** Añade una o varias imágenes a la galería de una colección (data URI en BD). */
export async function addCollectionImagesAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const id = String(formData.get('collectionId'));
  const files = formData.getAll('files').filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return;
  let order = await prisma.collectionMedia.count({ where: { collectionId: id, kind: 'IMAGE' } });
  for (const file of files) {
    if (file.size > 15 * 1024 * 1024) continue; // salta las que superen 15 MB
    const [url, urlMobile] = await Promise.all([
      optimizeImageToDataUri(file, 1000),
      optimizeImageToDataUri(file, 640),
    ]);
    await prisma.collectionMedia.create({
      data: { collectionId: id, kind: 'IMAGE', url, urlMobile, sortOrder: order++ },
    });
  }
  await audit(admin.id, admin.email, 'collection.media_add', 'Collection', id, null, { images: files.length });
  revalidateCollections();
}

/** Añade un vídeo a una colección: por URL (YouTube/Vimeo/.mp4) o subiendo archivo. */
export async function addCollectionVideoAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const id = String(formData.get('collectionId'));
  const pastedUrl = String(formData.get('url') ?? '').trim();
  const file = formData.get('file');

  let url = pastedUrl;
  if (!url && file instanceof File && file.size > 0) {
    url = (await saveUpload(file)).url; // sube al Volume, límite 60 MB (saveUpload)
  }
  if (!url) return;

  const order = await prisma.collectionMedia.count({ where: { collectionId: id, kind: 'VIDEO' } });
  await prisma.collectionMedia.create({
    data: { collectionId: id, kind: 'VIDEO', url, sortOrder: order },
  });
  await audit(admin.id, admin.email, 'collection.video_add', 'Collection', id, null, { url });
  revalidateCollections();
}

/** Elimina un elemento (imagen o vídeo) de la galería de una colección. */
export async function deleteCollectionMediaAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const mediaId = String(formData.get('mediaId'));
  const m = await prisma.collectionMedia.findUnique({ where: { id: mediaId }, select: { collectionId: true, kind: true } });
  if (!m) return;
  await prisma.collectionMedia.delete({ where: { id: mediaId } }).catch(() => {});
  await audit(admin.id, admin.email, 'collection.media_delete', 'CollectionMedia', mediaId, { kind: m.kind }, null);
  revalidateCollections();
}

/** Asigna (o quita) un producto a una colección. */
export async function assignProductCollectionAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const productId = String(formData.get('productId'));
  const collectionId = String(formData.get('collectionId') ?? '') || null;
  await prisma.product.update({ where: { id: productId }, data: { collectionId } });
  await audit(admin.id, admin.email, 'product.assign_collection', 'Product', productId, null, { collectionId });
  revalidateCollections();
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
  // PayPal guarda AMBOS juegos (sandbox y live) + el modo activo, para poder
  // alternar sin reescribir credenciales. paypal.mode no es secreto (siempre se
  // guarda); las credenciales solo se sobrescriben si llegan con valor.
  const fields = gateway === 'stripe'
    ? ['stripe.secret_key', 'stripe.publishable_key', 'stripe.webhook_secret']
    : [
        'paypal.sandbox.client_id',
        'paypal.sandbox.client_secret',
        'paypal.sandbox.webhook_id',
        'paypal.live.client_id',
        'paypal.live.client_secret',
        'paypal.live.webhook_id',
        'paypal.mode',
      ];
  for (const key of fields) {
    const value = String(formData.get(key) ?? '');
    // No borrar una credencial existente si el campo llega vacío (excepto el modo).
    if (value === '' && key !== 'paypal.mode') continue;
    await prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value, group: 'payments' },
    });
  }

  // IDs de plan de suscripción: se guardan para el modo seleccionado
  // (paypal.{mode}.plan.{CLUB}.{CUR}). Solo se sobrescriben si llegan con valor.
  if (gateway === 'paypal') {
    const mode = String(formData.get('paypal.mode') || 'sandbox');
    for (const club of ['PRIME', 'PRESTIGE']) {
      for (const cur of ['EUR', 'USD']) {
        const planVal = String(formData.get(`paypal.plan.${club}.${cur}`) ?? '').trim();
        if (!planVal) continue;
        const key = `paypal.${mode}.plan.${club}.${cur}`;
        await prisma.systemSetting.upsert({
          where: { key },
          update: { value: planVal },
          create: { key, value: planVal, group: 'payments' },
        });
      }
    }
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

// ───────────────── Carnet digital / Wallet (Apple & Google) ─────────────────

/**
 * Configura el sistema de carnet digital y futuros pases de Wallet.
 * - Flags (activar carnet/QR, Apple, Google) desde checkboxes.
 * - TTL del token en días.
 * - Secretos (HMAC, certificado Apple, service account Google): solo se
 *   sobrescriben si llegan con valor (campo vacío conserva lo guardado).
 */
export async function saveWalletAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  // _scope evita que un formulario pise los flags del otro (una casilla
  // desmarcada no se envía; solo procesamos los flags de su propio bloque).
  const scope = String(formData.get('_scope') ?? '');

  const upsert = (key: string, value: boolean | string) =>
    prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value, group: 'wallet' },
    });

  if (scope === 'card') {
    await upsert('wallet.enabled', formData.get('enabled') === 'on');
    const ttl = String(formData.get('wallet.token_ttl_days') ?? '').trim();
    if (ttl) await upsert('wallet.token_ttl_days', ttl);
    const secret = String(formData.get('wallet.token_secret') ?? '');
    if (secret !== '') await upsert('wallet.token_secret', secret);
  }

  if (scope === 'platforms') {
    await upsert('wallet.apple.enabled', formData.get('apple_enabled') === 'on');
    await upsert('wallet.google.enabled', formData.get('google_enabled') === 'on');
    // IDs no secretos: se sobrescriben siempre (vacío permitido).
    for (const key of ['wallet.apple.team_id', 'wallet.apple.pass_type_id', 'wallet.google.issuer_id']) {
      await upsert(key, String(formData.get(key) ?? ''));
    }
    // Secretos: solo si llegan con valor (vacío conserva el guardado).
    for (const key of ['wallet.apple.cert_p12', 'wallet.apple.cert_password', 'wallet.google.service_account_json']) {
      const value = String(formData.get(key) ?? '');
      if (value !== '') await upsert(key, value);
    }
  }

  await audit(admin.id, admin.email, 'wallet.save', 'SystemSetting', scope || 'wallet', null, null);
  revalidatePath('/lf-admin/carnet');
}

/** Genera y guarda un secreto HMAC robusto para el token del carnet. */
export async function generateWalletSecretAction(): Promise<void> {
  const admin = await ensureAdmin();
  const secret = generatePassSecret();
  await prisma.systemSetting.upsert({
    where: { key: 'wallet.token_secret' },
    update: { value: secret },
    create: { key: 'wallet.token_secret', value: secret, group: 'wallet' },
  });
  await audit(admin.id, admin.email, 'wallet.secret.generate', 'SystemSetting', 'wallet.token_secret', null, null);
  revalidatePath('/lf-admin/carnet');
}

// ───────────────── Envío de correos (proveedor + credenciales) ─────────────────

/** Guarda la configuración de envío de emails (proveedor, remitente, credenciales). */
export async function saveEmailAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const upsert = (key: string, value: string | boolean) =>
    prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value, group: 'email' },
    });

  const provider = String(formData.get('email.provider') ?? 'console');
  const trimmed = (k: string) => String(formData.get(k) ?? '').trim();
  await upsert('email.provider', ['resend', 'smtp', 'console'].includes(provider) ? provider : 'console');
  await upsert('email.from', trimmed('email.from'));
  // SMTP: campos no secretos (recortados para evitar espacios/caracteres ocultos).
  await upsert('email.smtp.host', trimmed('email.smtp.host'));
  await upsert('email.smtp.port', trimmed('email.smtp.port'));
  await upsert('email.smtp.user', trimmed('email.smtp.user'));
  await upsert('email.smtp.helo', trimmed('email.smtp.helo'));
  await upsert('email.smtp.secure', formData.get('email.smtp.secure') === 'on' ? 'true' : 'false');
  // Secretos: solo se sobrescriben si llegan con valor.
  for (const key of ['email.resend.api_key', 'email.smtp.password']) {
    const value = String(formData.get(key) ?? '');
    if (value !== '') await upsert(key, value);
  }
  await audit(admin.id, admin.email, 'email.save', 'SystemSetting', 'email', null, { provider });
  revalidatePath('/lf-admin/config');
}

/** Envía un email de prueba (conectividad del proveedor) y guarda el resultado. */
export async function sendTestEmailConfigAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const to = String(formData.get('to') ?? '').trim() || admin.email || '';
  let result: { success: boolean; provider: string; error?: string };
  if (!to) {
    result = { success: false, provider: 'none', error: 'Falta el destinatario' };
  } else {
    const body = `
      <h2 style="font-family:'Inter',Arial,Helvetica,sans-serif;color:#9C7E1C;font-size:19px;margin:0 0 12px">Configuración de correo verificada</h2>
      <p style="margin:0 0 12px">Este es un email de prueba de <strong>Legacy Fan</strong>. Si lo estás leyendo, el envío de correos del sistema funciona correctamente.</p>
      <p style="margin:0 0 12px">A partir de ahora recibirás por este medio las comunicaciones de tu cuenta: verificación, recibos de pago, avisos de pedidos y novedades del club.</p>
      <p style="margin:16px 0 0;font-size:13px;color:#666">Fecha de la prueba: ${new Date().toLocaleString('es-ES')}</p>`;
    result = await getEmailProvider().send({
      to,
      subject: 'Prueba de envío · Legacy Fan',
      html: emailShell(body, 'es'),
      text: 'Prueba de envio de Legacy Fan. Si lo recibes, la configuracion de correo funciona correctamente.',
    });
    await prisma.emailLog.create({
      data: { toEmail: to, provider: result.provider, success: result.success, error: result.error ?? null },
    });
  }
  const msg = result.success
    ? `OK · aceptado por ${result.provider} para ${to}${result.error ? ` · ${result.error}` : ''}`
    : `ERROR (${result.provider}): ${result.error ?? 'desconocido'}`;
  await prisma.systemSetting.upsert({
    where: { key: 'email.test_result' },
    update: { value: msg },
    create: { key: 'email.test_result', value: msg, group: 'email' },
  });
  await audit(admin.id, admin.email, 'email.test', 'SystemSetting', 'email', null, { to, success: result.success });
  revalidatePath('/lf-admin/config');
}

/**
 * Imagen de una moneda del upsell (a|b): por subida de fichero o por URL pegada.
 * Guarda la URL en settings y, si falla, un mensaje de error visible en el panel.
 */
export async function uploadUpsellCoinImageAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const coin = String(formData.get('coin') ?? 'a') === 'b' ? 'b' : 'a';
  const key = `upsell.coin.${coin}.image`;
  const errKey = `upsell.coin.${coin}.image_error`;
  const file = formData.get('file');
  const pastedUrl = String(formData.get('url') ?? '').trim();

  const setErr = (msg: string) =>
    prisma.systemSetting.upsert({
      where: { key: errKey },
      update: { value: msg },
      create: { key: errKey, value: msg, group: 'upsell' },
    });

  try {
    let url: string;
    if (file instanceof File && file.size > 0) {
      // Imagen pequeña → optimizada (WebP) y guardada como data URI EN LA BD
      // (no depende del Volume, así se ve siempre).
      if (file.size > 6 * 1024 * 1024) throw new Error('La imagen supera 6 MB.');
      url = await optimizeImageToDataUri(file, 512);
    } else if (pastedUrl) {
      url = pastedUrl;
    } else {
      await setErr('No se recibió ni fichero ni URL.');
      revalidatePath('/lf-admin/config');
      return;
    }
    await prisma.systemSetting.upsert({
      where: { key },
      update: { value: url },
      create: { key, value: url, group: 'upsell' },
    });
    await prisma.systemSetting.deleteMany({ where: { key: errKey } });
    await audit(admin.id, admin.email, 'upsell.coin_image', 'SystemSetting', key, null, {
      kind: url.startsWith('data:') ? 'data-uri' : 'url',
    });
  } catch (e) {
    await setErr(e instanceof Error ? e.message : 'Error al guardar la imagen.');
  }
  revalidatePath('/lf-admin/config');
}

/** Prueba la conexión con la pasarela (credenciales del modo activo) y guarda el resultado. */
export async function testGatewayConnectionAction(formData: FormData): Promise<void> {
  await ensureAdmin();
  const gateway = String(formData.get('gateway') || 'paypal').toLowerCase();
  const res = await testGatewayConnection(gateway.toUpperCase() as 'PAYPAL' | 'STRIPE');
  const key = `${gateway}.test_result`;
  await prisma.systemSetting.upsert({
    where: { key },
    update: { value: `${res.ok ? 'OK' : 'ERROR'}: ${res.detail}` },
    create: { key, value: `${res.ok ? 'OK' : 'ERROR'}: ${res.detail}`, group: 'payments' },
  });
  revalidatePath('/lf-admin/config');
}

/**
 * Crea el plan/precio de suscripción anual en la pasarela (PayPal Billing Plan)
 * para un club y divisa, y guarda su id en `paypal.{mode}.plan.{CLUB}.{CUR}`.
 * El importe sale del precio actual del club. Guarda el error si falla, para
 * mostrarlo en el panel.
 */
export async function createSubscriptionPlanAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const gateway = String(formData.get('gateway') || 'paypal').toLowerCase();
  const club = String(formData.get('club') || '');
  const currency = (String(formData.get('currency') || 'EUR') as 'EUR' | 'USD');
  const mode = String(formData.get('mode') || 'sandbox');
  const errKey = `${gateway}.${mode}.plan_error.${club}.${currency}`;

  const setError = (msg: string) =>
    prisma.systemSetting.upsert({
      where: { key: errKey },
      update: { value: msg },
      create: { key: errKey, value: msg, group: 'payments' },
    });
  const clearError = () => prisma.systemSetting.deleteMany({ where: { key: errKey } });

  try {
    const [pricing, plan] = await Promise.all([getClubPricing(club, currency), getPlan(club)]);
    const amountCents = pricing?.priceCents ?? 0;
    const phaseKey = pricing?.phaseKey ?? 'NA';
    if (amountCents <= 0) {
      await setError('El club no tiene precio actual configurado.');
      revalidatePath('/lf-admin/config');
      return;
    }
    // El plan se crea para la FASE y precio vigentes (clave por fase + importe).
    const name = `${plan?.name ?? club} — Anual (${phaseKey})`;
    const provider = getSubscriptionProviderForAdmin(gateway.toUpperCase() as 'PAYPAL' | 'STRIPE');
    const { planId } = await provider.createSubscriptionPlan({
      club,
      name,
      currency,
      amountCents,
      intervalMonths: 12,
    });
    const key = `${gateway}.${mode}.plan.${club}.${currency}.${phaseKey}.${amountCents}`;
    await prisma.systemSetting.upsert({
      where: { key },
      update: { value: planId },
      create: { key, value: planId, group: 'payments' },
    });
    await clearError();
    await audit(admin.id, admin.email, 'subscription.plan_created', 'SystemSetting', key, null, {
      planId,
      club,
      currency,
      mode,
      phaseKey,
      amountCents,
    });
  } catch (e) {
    await setError(e instanceof Error ? e.message : 'Error creando el plan.');
  }
  revalidatePath('/lf-admin/config');
}

/** Crea un club nuevo (MembershipPlan) con una fase inicial de precio. */
export async function createClubAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const name = String(formData.get('name') ?? '').trim();
  if (!name) return;
  const code =
    (String(formData.get('code') ?? '').trim() || name)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 24) || 'CLUB';
  if (await prisma.membershipPlan.findUnique({ where: { club: code } })) return; // ya existe
  let slug = slugify(name) || code.toLowerCase();
  if (await prisma.membershipPlan.findUnique({ where: { slug } })) slug = `${slug}-${code.toLowerCase()}`;

  const priceEur = Math.round(parseFloat(String(formData.get('priceEur') ?? '0').replace(',', '.')) * 100) || 0;
  const priceUsd = Math.round(parseFloat(String(formData.get('priceUsd') ?? '0').replace(',', '.')) * 100) || 0;
  const listEur = String(formData.get('listPriceEur') ?? '').trim();
  const listUsd = String(formData.get('listPriceUsd') ?? '').trim();

  const plan = await prisma.membershipPlan.create({
    data: {
      club: code,
      name,
      slug,
      active: formData.get('active') === 'on',
      tagline: String(formData.get('tagline') ?? '') || null,
      listPriceEurCents: listEur ? Math.round(parseFloat(listEur.replace(',', '.')) * 100) : null,
      listPriceUsdCents: listUsd ? Math.round(parseFloat(listUsd.replace(',', '.')) * 100) : null,
      phases: {
        create: { key: 'FASE_0', name: 'Fase 0', priceEurCents: priceEur, priceUsdCents: priceUsd, isActive: true, sortOrder: 0 },
      },
    },
  });
  await audit(admin.id, admin.email, 'club.create', 'MembershipPlan', plan.id, null, { code, name });
  revalidatePath('/lf-admin/clubs');
  revalidatePath('/club');
}

/** Edita un club: nombre, tagline, activo, lanzamiento y reserva propios. */
export async function updateClubAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const id = String(formData.get('id'));
  const eur = String(formData.get('reservationEur') ?? '').trim();
  const usd = String(formData.get('reservationUsd') ?? '').trim();
  const listEur = String(formData.get('listPriceEur') ?? '').trim();
  const listUsd = String(formData.get('listPriceUsd') ?? '').trim();
  const launch = String(formData.get('launchDate') ?? '').trim();
  // Listas (un elemento por línea) para beneficios y condiciones.
  const toLines = (v: FormDataEntryValue | null) =>
    String(v ?? '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  const data = {
    name: String(formData.get('name') ?? '').trim() || undefined,
    tagline: String(formData.get('tagline') ?? '') || null,
    active: formData.get('active') === 'on',
    launchDate: launch ? new Date(launch) : null,
    reservationEurCents: eur ? Math.round(parseFloat(eur.replace(',', '.')) * 100) : null,
    reservationUsdCents: usd ? Math.round(parseFloat(usd.replace(',', '.')) * 100) : null,
    listPriceEurCents: listEur ? Math.round(parseFloat(listEur.replace(',', '.')) * 100) : null,
    listPriceUsdCents: listUsd ? Math.round(parseFloat(listUsd.replace(',', '.')) * 100) : null,
    body: String(formData.get('body') ?? '').trim() || null,
    slogan: String(formData.get('slogan') ?? '').trim() || null,
    renewalNote: String(formData.get('renewalNote') ?? '').trim() || null,
    benefits: toLines(formData.get('benefits')),
    conditions: toLines(formData.get('conditions')),
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
  redirect('/lf-admin/productos');
}

export async function deleteCollectionAction(formData: FormData): Promise<void> {
  const admin = await ensureAdmin();
  const id = String(formData.get('id'));
  // Evita borrar colecciones con productos (integridad).
  const count = await prisma.product.count({ where: { collectionId: id } });
  if (count > 0) return;
  await prisma.collection.delete({ where: { id } }).catch(() => {});
  await audit(admin.id, admin.email, 'collection.delete', 'Collection', id, null, null);
  revalidateCollections();
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
