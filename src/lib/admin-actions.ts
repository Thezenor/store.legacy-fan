'use server';

import { revalidatePath } from 'next/cache';
import type { CollectionStatus, Locale } from '@prisma/client';
import { prisma } from './prisma';
import { getAdminSession } from './admin';

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
    data: {
      name,
      slug,
      collectionId,
      description: String(formData.get('description') ?? '') || null,
      priceEurCents: eurosToCents(formData.get('priceEur')),
      priceUsdCents: eurosToCents(formData.get('priceUsd')),
      premiumEurCents: eurosToCents(formData.get('premiumEur')),
      premiumUsdCents: eurosToCents(formData.get('premiumUsd')),
      includedInPrime: formData.get('includedInPrime') === 'on',
      includedInPrestige: formData.get('includedInPrestige') === 'on',
      isInauguralCoin: formData.get('isInauguralCoin') === 'on',
      available: formData.get('available') === 'on',
      visible: formData.get('visible') === 'on',
    },
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
  await prisma.product.update({
    where: { id },
    data: {
      priceEurCents: eurosToCents(formData.get('priceEur')),
      priceUsdCents: eurosToCents(formData.get('priceUsd')),
      premiumEurCents: eurosToCents(formData.get('premiumEur')),
      premiumUsdCents: eurosToCents(formData.get('premiumUsd')),
      includedInPrime: formData.get('includedInPrime') === 'on',
      includedInPrestige: formData.get('includedInPrestige') === 'on',
      isInauguralCoin: formData.get('isInauguralCoin') === 'on',
      available: formData.get('available') === 'on',
      visible: formData.get('visible') === 'on',
    },
  });
  await audit(admin.id, admin.email, 'product.update', 'Product', id, null, { id });
  revalidatePath('/lf-admin/productos');
}
