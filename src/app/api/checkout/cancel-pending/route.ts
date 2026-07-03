import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPendingReservation } from '@/lib/checkout/reservation';
import { appUrl } from '@/lib/app-url';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function accountUrl(locale: string, qs: string): string {
  const prefix = locale && locale !== 'es' ? `/${locale}` : '';
  return `${appUrl()}${prefix}/account?${qs}`;
}

/**
 * Cancela un intento de pago SIN completar para que el usuario pueda empezar de
 * nuevo limpio. ⚠ Seguridad: solo se permite si NO se ha pagado nada
 * (amountPaidCents === 0). Si ya se pagó el depósito, no se puede autocancelar
 * (implicaría reembolso): se remite a soporte.
 */
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const locale = String(form?.get('locale') ?? 'es');

  const session = await auth();
  if (!session?.user?.id) return NextResponse.redirect(accountUrl(locale, 'error=unauthenticated'), 303);
  const userId = session.user.id;

  const reservation = await getPendingReservation(userId);
  if (!reservation) return NextResponse.redirect(accountUrl(locale, 'saved=attempt_cancelled'), 303);

  // Depósito ya pagado → no se puede autocancelar (requiere reembolso por soporte).
  if (reservation.amountPaidCents > 0) {
    return NextResponse.redirect(accountUrl(locale, 'error=paid_cannot_cancel'), 303);
  }

  await prisma.$transaction([
    prisma.payment.updateMany({
      where: { reservationId: reservation.id, status: 'PENDIENTE_DE_PAGO' },
      data: { status: 'CANCELADO' },
    }),
    prisma.reservation.update({
      where: { id: reservation.id },
      data: { status: 'CANCELADO' },
    }),
    prisma.auditLog.create({
      data: {
        actorId: userId,
        actorEmail: session.user.email ?? null,
        action: 'reservation.self_cancel',
        entity: 'Reservation',
        entityId: reservation.id,
        newValue: { status: 'CANCELADO', by: 'user' },
      },
    }),
  ]);

  return NextResponse.redirect(accountUrl(locale, 'saved=attempt_cancelled'), 303);
}
