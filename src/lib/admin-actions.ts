'use server';

import { revalidatePath } from 'next/cache';
import type { Locale } from '@prisma/client';
import { prisma } from './prisma';
import { getAdminSession } from './admin';

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
