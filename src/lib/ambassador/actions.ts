'use server';

import { redirect } from 'next/navigation';
import type { AmbassadorPayout, Currency } from '@prisma/client';
import { auth } from '../auth';
import { prisma } from '../prisma';
import { getAmbassadorConfig } from './config';

/** Embajador del usuario en sesión (o null). */
async function currentAmbassador() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.ambassador.findUnique({ where: { userId: session.user.id } });
}

/** El propio embajador reactiva su código (reinicia la caducidad a hoy + N meses). */
export async function reactivateOwnCodeAction(): Promise<void> {
  const amb = await currentAmbassador();
  if (!amb) redirect('/embajador?error=noamb');
  const cfg = await getAmbassadorConfig();
  const reactivateBy = new Date();
  reactivateBy.setMonth(reactivateBy.getMonth() + cfg.reactivateMonths);
  await prisma.ambassador.update({ where: { id: amb!.id }, data: { reactivatedAt: new Date(), reactivateBy } });
  await prisma.auditLog.create({
    data: { actorId: amb!.userId, action: 'ambassador.reactivate_self', entity: 'Ambassador', entityId: amb!.id, newValue: { reactivateBy: reactivateBy.toISOString() } },
  });
  redirect('/embajador?saved=reactivated');
}

/** El embajador edita sus datos fiscales y método de cobro (necesarios para liquidar). */
export async function updateOwnAmbassadorAction(formData: FormData): Promise<void> {
  const amb = await currentAmbassador();
  if (!amb) redirect('/embajador?error=noamb');
  const g = (k: string) => String(formData.get(k) ?? '').trim();
  const payoutRaw = g('payoutMethod');
  const payoutMethod = (['PAYPAL', 'TRANSFERENCIA', 'CREDITO'].includes(payoutRaw) ? payoutRaw : null) as AmbassadorPayout | null;
  const fiscalName = g('fiscalName');
  const fiscalId = g('fiscalId');
  const fiscalCountry = g('fiscalCountry');
  const fiscalOk = !!(fiscalName && fiscalId && fiscalCountry);
  await prisma.ambassador.update({
    where: { id: amb!.id },
    data: {
      fiscalName: fiscalName || null,
      fiscalId: fiscalId || null,
      fiscalAddress: g('fiscalAddress') || null,
      fiscalCountry: fiscalCountry || null,
      payoutMethod,
      fiscalOk,
    },
  });
  redirect('/embajador?saved=1');
}

/** Solicitud de cobro (post-campaña, al superar el umbral). Registra la petición;
 *  la liquidación real (autofactura + pago) la ejecuta el equipo (Fase 8). */
export async function requestAmbassadorPayoutAction(formData: FormData): Promise<void> {
  const amb = await currentAmbassador();
  if (!amb) redirect('/embajador?error=noamb');
  const currency = (String(formData.get('currency') ?? 'EUR') === 'USD' ? 'USD' : 'EUR') as Currency;
  const cfg = await getAmbassadorConfig();

  const rows = await prisma.ambassadorSignup.findMany({
    where: { ambassadorId: amb!.id, currency, state: 'VALIDADA' },
    select: { rewardCents: true },
  });
  const balance = rows.reduce((a, r) => a + r.rewardCents, 0);
  if (balance < cfg.payoutThresholdCents) redirect('/embajador?error=threshold');
  if (!amb!.fiscalOk) redirect('/embajador?error=fiscal');

  await prisma.auditLog.create({
    data: {
      actorId: amb!.userId,
      action: 'ambassador.payout_request',
      entity: 'Ambassador',
      entityId: amb!.id,
      newValue: { currency, balanceCents: balance },
    },
  });
  redirect('/embajador?saved=requested');
}
