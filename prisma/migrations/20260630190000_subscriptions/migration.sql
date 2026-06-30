-- Suscripciones recurrentes (renovación anual de la membresía), agnósticas de pasarela.
CREATE TYPE "SubscriptionStatus" AS ENUM ('PENDIENTE', 'ACTIVA', 'EN_PRUEBA', 'PAGO_FALLIDO', 'CANCELADA', 'CADUCADA');

CREATE TABLE "Subscription" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "provider" "PaymentProvider" NOT NULL,
  "mode" "PaymentMode" NOT NULL DEFAULT 'TEST',
  "providerSubscriptionId" TEXT,
  "status" "SubscriptionStatus" NOT NULL DEFAULT 'PENDIENTE',
  "club" TEXT NOT NULL,
  "currency" "Currency" NOT NULL,
  "amountCents" INTEGER NOT NULL DEFAULT 0,
  "intervalMonths" INTEGER NOT NULL DEFAULT 12,
  "currentPeriodEnd" TIMESTAMP(3),
  "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
  "rawPayload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription" ("userId");
CREATE UNIQUE INDEX "Subscription_providerSubscriptionId_key" ON "Subscription" ("providerSubscriptionId");
CREATE INDEX "Subscription_providerSubscriptionId_idx" ON "Subscription" ("providerSubscriptionId");

ALTER TABLE "Subscription"
  ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
