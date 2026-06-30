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
   - **Planes de suscripción**: el precio del plan es el de la **fase activa**. Como
     PayPal no permite editar el importe de un plan, **cada fase/precio tiene su propio
     plan**, que se **crea automáticamente al suscribirse** (o puedes pre-crearlo con el
     botón). Se guarda en `paypal.{mode}.plan.{CLUB}.{CUR}.{FASE}.{importe}`.

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

## Precio por fase
El plan se crea con el **precio de la fase activa** (de `getClubPricing`, que resuelve la
fase) y se cachea por `(modo, club, divisa, fase, importe)`. Al cambiar de fase (o de precio
dentro de una fase), la siguiente suscripción usa/crea **otro plan** con el precio nuevo;
las suscripciones ya activas conservan su plan (PayPal no permite cambiar su importe).

## Pasos que faltan para operarlo (no son código)
1. Guardar **credenciales** PayPal (sandbox) y marcar "Usar PayPal". Los planes se crean
   solos al suscribirse; opcionalmente pre-créalos con el botón por club/divisa.
2. Suscribir el webhook de PayPal a los eventos `BILLING.SUBSCRIPTION.*` y `PAYMENT.SALE.COMPLETED`.
3. Cambiar `billing.mode` a `subscription`.
4. Probar en **sandbox** el alta, una renovación y una cancelación.
5. (Stripe) Implementar verificación de firma + creación de Checkout Session `mode=subscription`
   cuando se decida activarlo.

## Nota sobre el depósito de reserva (50 €/$)
La reserva sigue siendo un pago único (depósito). La integración del descuento del depósito
en la **primera cuota** de la suscripción queda pendiente de decidir (PayPal permite
`setup_fee`/ajustes de primer ciclo; Stripe, cupones/`trial`). Hoy la suscripción cobra la
cuota anual completa del plan.
