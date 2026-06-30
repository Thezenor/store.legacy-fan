-- Contenido de marketing del club editable desde el superadmin.
ALTER TABLE "MembershipPlan" ADD COLUMN IF NOT EXISTS "body" TEXT;
ALTER TABLE "MembershipPlan" ADD COLUMN IF NOT EXISTS "slogan" TEXT;
ALTER TABLE "MembershipPlan" ADD COLUMN IF NOT EXISTS "renewalNote" TEXT;
ALTER TABLE "MembershipPlan" ADD COLUMN IF NOT EXISTS "benefits" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "MembershipPlan" ADD COLUMN IF NOT EXISTS "conditions" TEXT[] NOT NULL DEFAULT '{}';
