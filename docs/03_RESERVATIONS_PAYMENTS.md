# 03 — Reservas, pagos y facturación

## Cuenta obligatoria

Para reservar o comprar siempre hay que crear cuenta o iniciar sesión.

### Si el usuario está registrado

- Login.
- Continúa checkout.

### Si no está registrado

Pedir datos básicos:

- Nombre.
- Apellidos.
- Teléfono.
- País.
- Correo electrónico.
- Contraseña.
- Aceptación de términos.

Antes de crear cuenta:
- Comprobar que el correo no exista.
- Un email solo puede tener una cuenta.
- Un email solo puede tener una reserva/socio activa relacionada con club, salvo que el superadmin lo gestione manualmente.

## Reserva

- Importe: 50 € / 50 $.
- Sirve para cualquier club.
- El usuario puede reservar sin elegir definitivamente club o puede elegir inicialmente uno y cambiarlo al pagar completo.
- La reserva no asigna número de socio.
- La reserva no activa ventajas completas.
- La reserva no da acceso automático a Telegram/Discord.
- Desde el panel `/account` podrá pagar el resto.
- El pago restante debe hacerse en un único pago.
- No se permiten pagos parciales.
- El sistema descuenta automáticamente los 50 € / 50 $ pagados.

## Caducidad de reserva

- La reserva será válida hasta la fecha de lanzamiento configurada.
- Después de la fecha de lanzamiento hay 7 días de margen.
- Pasados esos 7 días sin pago completo, pasa a `reserva_caducada`.
- La fecha y caducidad deben ser configurables desde superadmin.

## Devolución reserva

- Reembolsable hasta 24 horas antes de la fecha de lanzamiento.
- Después se pierde y no es reembolsable.
- Esta regla debe poder configurarse desde superadmin.

## Pago completo

- El pago completo asigna club definitivo.
- Activa ventajas correspondientes.
- Asigna número de socio si es una membresía.
- Crea pedido interno con productos incluidos.
- Activa puntos según reglas.
- Activa referidos si aplica.

## Facturación

- Un solo pago/factura final con el total.
- La reserva genera comprobante interno.
- La factura definitiva se genera con pago completo total.
- Configuración fiscal, datos de empresa, impuestos y facturas desde superadmin.

## Pasarelas

- PayPal activo desde inicio.
- Stripe preparado, pero desactivado inicialmente.
- Superadmin puede activar/desactivar pasarelas y configurar credenciales.
