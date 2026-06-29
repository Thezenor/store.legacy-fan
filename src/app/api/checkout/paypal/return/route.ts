import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { captureReservationByOrder } from '@/lib/checkout/reservation';
import { sendReservationReceivedEmail } from '@/lib/email/checkout-emails';
import { formatMoney } from '@/lib/commerce/money';

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

function localizedPath(locale: string, path: string): string {
  const prefix = locale && locale !== 'es' ? `/${locale}` : '';
  return `${appUrl()}${prefix}${path}`;
}

// Retorno desde PayPal tras aprobar: captura el pago y redirige a /account.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('token'); // PayPal devuelve el order id como ?token=
  const locale = searchParams.get('locale') || 'es';

  if (!orderId) {
    return NextResponse.redirect(localizedPath(locale, '/club'));
  }

  try {
    const reservationId = await captureReservationByOrder(orderId);
    if (reservationId) {
      const reservation = await prisma.reservation.findUnique({
        where: { id: reservationId },
        include: { user: true },
      });
      if (reservation?.user?.email && reservation.amountPaidCents > 0) {
        await sendReservationReceivedEmail(
          reservation.user.email,
          locale as 'es' | 'en' | 'fr' | 'it',
          formatMoney(reservation.amountPaidCents, reservation.currency, locale),
        );
      }
    }
    return NextResponse.redirect(localizedPath(locale, '/account?reserved=1'));
  } catch {
    return NextResponse.redirect(localizedPath(locale, '/account?error=capture'));
  }
}
