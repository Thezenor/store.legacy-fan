import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPaymentProviderUnchecked } from '@/lib/payments';
import { reconcileReservationPaid } from '@/lib/checkout/reservation';
import { reconcileFullPaymentPaid } from '@/lib/checkout/full-payment';
import {
  reconcileSubscriptionActivated,
  reconcileSubscriptionRenewed,
  reconcileSubscriptionCancelled,
  reconcileSubscriptionSuspended,
} from '@/lib/subscriptions';

// Webhook PayPal (doc 14). Verifica firma y reconcilia el estado de la reserva.
// Idempotente: PAYMENT.CAPTURE.COMPLETED puede llegar varias veces.
export async function POST(req: NextRequest) {
  const body = await req.text();
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  try {
    const provider = getPaymentProviderUnchecked('PAYPAL');
    const result = await provider.verifyWebhook(headers, body);
    if (!result.verified) {
      return NextResponse.json({ ok: false, reason: 'unverified' }, { status: 400 });
    }

    // Idempotencia por id de evento: si ya lo procesamos, no repetir.
    const eventId = (result.raw as { id?: string }).id;
    if (eventId) {
      try {
        await prisma.webhookEvent.create({
          data: { id: eventId, provider: 'PAYPAL', eventType: result.eventType },
        });
      } catch {
        return NextResponse.json({ ok: true, duplicate: true });
      }
    }

    const event = result.raw as {
      resource?: {
        id?: string;
        custom_id?: string;
        amount?: { value?: string };
        billing_agreement_id?: string;
      };
    };

    switch (result.eventType) {
      // ── Pagos únicos (reserva / pago completo) ──────────────────────────
      case 'PAYMENT.CAPTURE.COMPLETED': {
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
        break;
      }

      // ── Suscripciones (renovación anual) ────────────────────────────────
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        if (event.resource?.id) await reconcileSubscriptionActivated(event.resource.id);
        break;
      case 'PAYMENT.SALE.COMPLETED':
        // Cobro recurrente: billing_agreement_id = id de la suscripción.
        if (event.resource?.billing_agreement_id) {
          await reconcileSubscriptionRenewed(event.resource.billing_agreement_id);
        }
        break;
      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.EXPIRED':
        if (event.resource?.id) await reconcileSubscriptionCancelled(event.resource.id);
        break;
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
        if (event.resource?.id) await reconcileSubscriptionSuspended(event.resource.id);
        break;
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
