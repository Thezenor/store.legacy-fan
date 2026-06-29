import { NextResponse, type NextRequest } from 'next/server';
import { getPaymentProvider } from '@/lib/payments';
import { reconcileReservationPaid } from '@/lib/checkout/reservation';

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
      const customId = event.resource?.custom_id;
      const value = event.resource?.amount?.value;
      if (customId && value) {
        await reconcileReservationPaid(customId, Math.round(parseFloat(value) * 100));
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
