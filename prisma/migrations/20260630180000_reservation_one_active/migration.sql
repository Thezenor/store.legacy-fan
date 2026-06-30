-- Backstop de concurrencia: como máximo una reserva activa por usuario.
-- Evita reservas/pagos duplicados ante doble envío del checkout (doble clic,
-- reintento de red, multipestaña). Índice único parcial sobre los estados activos.
CREATE UNIQUE INDEX IF NOT EXISTS "reservation_one_active_per_user"
ON "Reservation" ("userId")
WHERE status IN ('RESERVA_PENDIENTE', 'PENDIENTE_DE_PAGO');
