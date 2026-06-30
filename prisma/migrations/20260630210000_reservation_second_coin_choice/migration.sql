-- Cómo añade el socio la 2ª moneda: reserve (depósito) / full (precio) / none.
ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "secondCoinChoice" TEXT;
