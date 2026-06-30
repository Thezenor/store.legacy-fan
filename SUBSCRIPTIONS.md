# Suscripciones (renovación anual de la membresía)

La membresía es **anual y renovable**; el **número de socio es permanente** (no depende
de la suscripción). El modelo está planteado de forma **agnóstica de pasarela**: PayPal
(Subscriptions/Billing) está implementado y Stripe (Billing) queda **preparado y
desactivado**, igual que el resto del proyecto.

## Cómo se activa
1. En **`/lf-admin → Configuración`**:
   - **Modelo de cobro** = `Suscripción (renovación automática)` (`billing.mode=subscription`).
     Con `one_time` se mantiene el pago único actual.
2. En **`/lf-admin → Configuración → Pasarelas`** (PayPal):
   - Credenciales sandbox/live (ya existentes) + **Modo activo**.
   - **Planes de suscripción**: pega los **Plan IDs** de PayPal (`P-XXXX`) para
     Prime/Prestige × EUR/USD, **por modo**. Cada plan fija su importe anual y divisa.

## Flujo
- Checkout (pago completo) → si `billing.mode=subscription`, `startSubscription()` crea la
  suscripción en la pasarela y redirige a aprobar.
- **Webhooks** (fuente de verdad) reconcilian el ciclo de vida:
  - `BILLING.SUBSCRIPTION.ACTIVATED` → alta de socio (número permanente) + 1er periodo.
  - `PAYMENT.SALE.COMPLETED` (recurrente) → **renovación**: extiende `Membership.endsAt`
    al `next_billing_time` (idempotente, nunca acorta).
  - `CANCELLED`/`EXPIRED` → no renovará (la membresía sigue hasta su fin).
  - `SUSPENDED`/`PAYMENT.FAILED` → `PAGO_FALLIDO` + socio suspendido.
- Stripe: webhook en `/api/webhooks/stripe` (mapea `invoice.paid`,
  `customer.subscription.*`) — devuelve OK sin procesar mientras esté desactivado.

## Modelo de datos
`Subscription` (1 por usuario): provider, mode, providerSubscriptionId, status
(`SubscriptionStatus`), club, currency, amountCents, intervalMonths(=12),
currentPeriodEnd, cancelAtPeriodEnd. La renovación vive en `renewMembershipTx`.

## URLs de webhook a registrar en la pasarela
- PayPal: `https://store.legacy-fan.com/api/webhooks/paypal`
  (eventos de suscripción: `BILLING.SUBSCRIPTION.*`, `PAYMENT.SALE.COMPLETED`).
- Stripe (futuro): `https://store.legacy-fan.com/api/webhooks/stripe`.

## Pasos que faltan para operarlo (no son código)
1. **Crear los planes** en PayPal (Catalog Product + Billing Plan anual) por club y divisa,
   y pegar sus IDs en el panel. (Opcional a futuro: acción admin que los cree por API.)
2. Suscribir el webhook de PayPal a los eventos `BILLING.SUBSCRIPTION.*` y `PAYMENT.SALE.COMPLETED`.
3. Cambiar `billing.mode` a `subscription` cuando los planes estén listos.
4. Probar en **sandbox** el alta, una renovación y una cancelación.
5. (Stripe) Implementar verificación de firma + creación de Checkout Session `mode=subscription`
   cuando se decida activarlo.

## Nota sobre el depósito de reserva (50 €/$)
La reserva sigue siendo un pago único (depósito). La integración del descuento del depósito
en la **primera cuota** de la suscripción queda pendiente de decidir (PayPal permite
`setup_fee`/ajustes de primer ciclo; Stripe, cupones/`trial`). Hoy la suscripción cobra la
cuota anual completa del plan.
