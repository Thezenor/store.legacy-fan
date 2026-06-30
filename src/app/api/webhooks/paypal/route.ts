import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPaymentProvider } from '@/lib/payments';
import { reconcileReservationPaid } from '@/lib/checkout/reservation';
import { reconcileFullPaymentPaid } from '@/lib/checkout/full-payment';

// Webhook PayPal (doc 14). Verifica firma y reconcilia el estado de la reserva.
// Idempotente: PAYMENT.CAPTURE.COMPLETED puede llegar varias veces.
export async function POST(req: NextRequest) {
  const body = await req.text();
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  try {
    const provider = getPaymentProvider('PAYPAL');
    const result = await provider.verifyWebhook(headers, body);
    if (!result.verified) {
      return NextResponse.json({ ok: false, reason: 'unverified' }, { status: 400 });
    }

    if (result.eventType === 'PAYMENT.CAPTURE.COMPLETED') {
      const event = result.raw as {
        resource?: { custom_id?: string; amount?: { value?: string } };
      };
      const customId = event.resource?.custom_id; // = reservationId
      const value = event.resource?.amount?.value;
      if (customId && value) {
        const amountCents = Math.round(parseFloat(value) * 100);
        // Distinguir intención por el tipo de la reserva: un pago completo debe
        // activar la membresía (no quedarse como depósito de reserva).
        const reservation = await prisma.reservation.findUnique({
          where: { id: customId },
          select: { type: true },
        });
        if (reservation?.type === 'PAGO_COMPLETO') {
          await reconcileFullPaymentPaid(customId, amountCents);
        } else {
          await reconcileReservationPaid(customId, amountCents);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
