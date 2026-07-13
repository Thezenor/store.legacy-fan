-- Programa de Embajadores (Bloque 2): modelo de datos base.
DO $$ BEGIN CREATE TYPE "AmbassadorModel" AS ENUM ('A','B','C'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "AmbassadorStatus" AS ENUM ('ACTIVO','SUSPENDIDO','CANCELADO'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "AmbassadorPayout" AS ENUM ('PAYPAL','TRANSFERENCIA','CREDITO'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "SignupCodeType" AS ENUM ('AMBASSADOR','MEMBER'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "SignupState" AS ENUM ('RESERVADA','PAGADA','EN_RETENCION','VALIDADA','LIQUIDADA','REVERTIDA','CANCELADA','EN_REVISION'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "SettlementState" AS ENUM ('PENDIENTE','PAGADA'); EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "Ambassador" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "channelUrl" TEXT,
  "segment" TEXT,
  "locale" TEXT,
  "model" "AmbassadorModel" NOT NULL DEFAULT 'A',
  "payoutMethod" "AmbassadorPayout",
  "fiscalName" TEXT,
  "fiscalId" TEXT,
  "fiscalAddress" TEXT,
  "fiscalCountry" TEXT,
  "fiscalOk" BOOLEAN NOT NULL DEFAULT false,
  "status" "AmbassadorStatus" NOT NULL DEFAULT 'ACTIVO',
  "reactivatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reactivateBy" TIMESTAMP(3),
  "notes" TEXT,
  "userId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Ambassador_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Ambassador_code_key" ON "Ambassador"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "Ambassador_userId_key" ON "Ambassador"("userId");
CREATE INDEX IF NOT EXISTS "Ambassador_status_idx" ON "Ambassador"("status");

CREATE TABLE IF NOT EXISTS "AmbassadorSignup" (
  "id" TEXT NOT NULL,
  "reservationId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "codeType" "SignupCodeType" NOT NULL DEFAULT 'AMBASSADOR',
  "ambassadorId" TEXT,
  "referrerUserId" TEXT,
  "plan" TEXT,
  "currency" "Currency" NOT NULL,
  "phase" TEXT,
  "phasePriceCents" INTEGER NOT NULL DEFAULT 0,
  "discountCents" INTEGER NOT NULL DEFAULT 0,
  "rewardCents" INTEGER NOT NULL DEFAULT 0,
  "model" "AmbassadorModel",
  "state" "SignupState" NOT NULL DEFAULT 'RESERVADA',
  "reservePaidAt" TIMESTAMP(3),
  "fullPaidAt" TIMESTAMP(3),
  "retentionUntil" TIMESTAMP(3),
  "fromInitialPhase" BOOLEAN NOT NULL DEFAULT false,
  "selfPurchase" BOOLEAN NOT NULL DEFAULT false,
  "valid" BOOLEAN NOT NULL DEFAULT false,
  "ipHash" TEXT,
  "deviceHash" TEXT,
  "emailNorm" TEXT,
  "billingNorm" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AmbassadorSignup_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "AmbassadorSignup_reservationId_key" ON "AmbassadorSignup"("reservationId");
CREATE INDEX IF NOT EXISTS "AmbassadorSignup_ambassadorId_idx" ON "AmbassadorSignup"("ambassadorId");
CREATE INDEX IF NOT EXISTS "AmbassadorSignup_code_idx" ON "AmbassadorSignup"("code");
CREATE INDEX IF NOT EXISTS "AmbassadorSignup_state_idx" ON "AmbassadorSignup"("state");

CREATE TABLE IF NOT EXISTS "AmbassadorSettlement" (
  "id" TEXT NOT NULL,
  "ambassadorId" TEXT NOT NULL,
  "period" TEXT NOT NULL,
  "currency" "Currency" NOT NULL,
  "amountCents" INTEGER NOT NULL DEFAULT 0,
  "method" "AmbassadorPayout" NOT NULL,
  "fromInitial" BOOLEAN NOT NULL DEFAULT false,
  "creditBonusCents" INTEGER NOT NULL DEFAULT 0,
  "totalPayCents" INTEGER NOT NULL DEFAULT 0,
  "invoiceRef" TEXT,
  "paidAt" TIMESTAMP(3),
  "state" "SettlementState" NOT NULL DEFAULT 'PENDIENTE',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AmbassadorSettlement_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AmbassadorSettlement_ambassadorId_idx" ON "AmbassadorSettlement"("ambassadorId");

DO $$ BEGIN
  ALTER TABLE "Ambassador" ADD CONSTRAINT "Ambassador_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "AmbassadorSignup" ADD CONSTRAINT "AmbassadorSignup_reservationId_fkey"
    FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "AmbassadorSignup" ADD CONSTRAINT "AmbassadorSignup_ambassadorId_fkey"
    FOREIGN KEY ("ambassadorId") REFERENCES "Ambassador"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "AmbassadorSettlement" ADD CONSTRAINT "AmbassadorSettlement_ambassadorId_fkey"
    FOREIGN KEY ("ambassadorId") REFERENCES "Ambassador"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
