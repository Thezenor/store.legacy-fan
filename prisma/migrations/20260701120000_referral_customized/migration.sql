-- El socio puede personalizar su código de referido UNA vez.
ALTER TABLE "ReferralCode" ADD COLUMN "customized" BOOLEAN NOT NULL DEFAULT false;
