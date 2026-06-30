-- Retención al cancelar: registro de baja/downgrade + flag de downgrade en suscripción.
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "downgradeToClub" TEXT;

CREATE TABLE IF NOT EXISTS "CancellationFeedback" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "fromClub" TEXT,
  "outcome" TEXT NOT NULL,
  "reason" TEXT,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CancellationFeedback_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "CancellationFeedback_userId_idx" ON "CancellationFeedback" ("userId");
