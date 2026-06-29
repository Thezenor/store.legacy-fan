# 06 — Puntos, saldo y referidos

## Puntos como saldo real

- Los puntos funcionan como saldo/crédito interno para gastar en la tienda.
- Configurable desde superadmin.
- Se generan solo sobre el premium, no sobre valor spot del metal.
- Los descuentos también aplican solo sobre premium.
- Se asignan al finalizar pago.
- Si hay devolución, se descuenta el saldo/puntos regalados.
- Caducidad por defecto: 2 años.
- Caducidad configurable desde superadmin.

## Configuración puntos

Superadmin debe configurar:

- ratio puntos por EUR/USD gastado
- equivalencia puntos/saldo
- caducidad
- productos excluidos
- si acumulan Prime/Prestige distinto
- si se aplican en promociones
- límites de canje
- mínimo/máximo de saldo por pedido
- fecha inicio/fin de campañas

## Promociones puntos

Debe soportar:

- multiplica tus puntos x2
- multiplica tus puntos x3
- puntos extra por club
- puntos extra por campaña
- puntos extra por producto/colección
- campañas por fechas
- reglas por país
- reglas por moneda
- exclusivas para Prime/Prestige

## Referidos

- Recompensa configurable desde superadmin.
- El cliente puede elegir modalidad:
  - 100% para quien refiere
  - 50/50
  - 100% para el referido
- La recompensa solo se activa cuando el referido paga completo.
- No se activa con reserva.
- Solo saldo interno para gastar en la tienda.
- No hay retirada bancaria inicial.
- Cada socio tendrá código de referido.
- El código puede ser editable si no duplica otro.
- Panel con estadísticas:
  - códigos usados
  - registros
  - reservas
  - pagos completados
  - saldo generado
  - saldo disponible
  - saldo pendiente
  - conversión
