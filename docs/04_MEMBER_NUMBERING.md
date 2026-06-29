# 04 — Numeración de socios

## Regla global

- Numeración única global para todos los socios.
- No hay distinción por Prime o Prestige en el número.
- Formato: `LF-000101`.

## Números reservados

- `LF-000001` a `LF-000100` reservados para asignación manual por superadmin.
- Numeración automática empieza en `LF-000101`.

## Asignación

- Solo se asigna número con pago completo de membresía.
- La reserva no asigna número.
- Comprar monedas sueltas no asigna número si no hay club activo.
- Si alguien hace upgrade de Prime a Prestige, mantiene su número.
- Número permanente para siempre.

## Transferencia

- Número intransferible.
- Solo transferible por aprobación/manual del superadmin.

## Superadmin

Debe poder:
- Crear socio manualmente.
- Asignar números 1–100.
- Cambiar número manualmente si es necesario.
- Bloquear número.
- Ver histórico de cambios.
- Evitar duplicados.
