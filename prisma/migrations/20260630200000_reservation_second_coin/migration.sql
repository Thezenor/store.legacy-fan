-- Upsell de 2ª moneda (Prestige): elección de moneda incluida y segunda con descuento.
ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "includedCoin" TEXT;
ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "secondCoin" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "secondCoinCents" INTEGER NOT NULL DEFAULT 0;
