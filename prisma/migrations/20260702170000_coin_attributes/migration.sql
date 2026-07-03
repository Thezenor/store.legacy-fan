-- Atributos de moneda (ref. plugin Legacy Woo Tools): complementos de la pieza.
ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS "productType"    TEXT,
  ADD COLUMN IF NOT EXISTS "purity"         TEXT,
  ADD COLUMN IF NOT EXISTS "limitedEdition" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "totalUnits"     INTEGER,
  ADD COLUMN IF NOT EXISTS "specialLabel"   TEXT,
  ADD COLUMN IF NOT EXISTS "ipLicense"      TEXT,
  ADD COLUMN IF NOT EXISTS "features"       TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "country"        TEXT,
  ADD COLUMN IF NOT EXISTS "faceValue"      TEXT,
  ADD COLUMN IF NOT EXISTS "quality"        TEXT,
  ADD COLUMN IF NOT EXISTS "coa"            TEXT,
  ADD COLUMN IF NOT EXISTS "boxInfo"        TEXT,
  ADD COLUMN IF NOT EXISTS "capsule"        TEXT,
  ADD COLUMN IF NOT EXISTS "coinFeatures"   TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
