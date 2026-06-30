-- Precio oficial (PVP) por club, mostrado tachado sobre el precio actual.
ALTER TABLE "MembershipPlan" ADD COLUMN IF NOT EXISTS "listPriceEurCents" INTEGER;
ALTER TABLE "MembershipPlan" ADD COLUMN IF NOT EXISTS "listPriceUsdCents" INTEGER;
