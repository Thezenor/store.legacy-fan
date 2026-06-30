import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { captureReservationByOrder } from '@/lib/checkout/reservation';
import { captureFullPaymentByOrder } from '@/lib/checkout/full-payment';
import { sendReservationReceivedEmail, sendFullPaymentEmail } from '@/lib/email/checkout-emails';
import { formatMoney } from '@/lib/commerce/money';

import { appUrl } from '@/lib/app-url';

function localizedPath(locale: string, path: string): string {
  const prefix = locale && locale !== 'es' ? `/${locale}` : '';
  return `${appUrl()}${prefix}${path}`;
}

// Retorno desde PayPal tras aprobar: captura el pago y redirige a /account.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('token'); // PayPal devuelve el order id como ?token=
  const locale = searchParams.get('locale') || 'es';
  const intent = searchParams.get('intent') || 'reserve';
  const loc = locale as 'es' | 'en' | 'fr' | 'it';

  if (!orderId) {
    return NextResponse.redirect(localizedPath(locale, '/club'));
  }

  try {
    if (intent === 'full') {
      const result = await captureFullPaymentByOrder(orderId);
      // Captura no COMPLETED (PENDING/FAILED): no fingir éxito.
      if (result === 'pending') {
        return NextResponse.redirect(localizedPath(locale, '/account?pending=1'));
      }
      if (result) {
        const data = await prisma.reservation.findUnique({
          where: { id: result },
          include: { user: { include: { membership: { include: { memberNumber: true } } } } },
        });
        const memberNo = data?.user?.membership?.memberNumber?.formatted;
        if (data?.user?.email && memberNo) {
          await sendFullPaymentEmail(data.user.email, loc, memberNo);
        }
        return NextResponse.redirect(localizedPath(locale, '/account?welcome=1'));
      }
      return NextResponse.redirect(localizedPath(locale, '/account?error=capture'));
    }

    const reservationId = await captureReservationByOrder(orderId);
    if (reservationId) {
      const reservation = await prisma.reservation.findUnique({
        where: { id: reservationId },
        include: { user: true },
      });
      if (reservation?.user?.email && reservation.amountPaidCents > 0) {
        await sendReservationReceivedEmail(
          reservation.user.email,
          loc,
          formatMoney(reservation.amountPaidCents, reservation.currency, locale),
        );
      }
    }
    return NextResponse.redirect(localizedPath(locale, '/account?reserved=1'));
  } catch {
    return NextResponse.redirect(localizedPath(locale, '/account?error=capture'));
  }
}
