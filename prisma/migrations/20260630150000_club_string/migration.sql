-- Club pasa de enum (ClubType) a texto libre para permitir clubs nuevos.
-- No destructivo: conserva los valores existentes (PRIME/PRESTIGE) y los índices.
ALTER TABLE "Membership" ALTER COLUMN "club" TYPE TEXT USING "club"::text;
ALTER TABLE "MembershipPlan" ALTER COLUMN "club" TYPE TEXT USING "club"::text;
ALTER TABLE "Reservation" ALTER COLUMN "club" TYPE TEXT USING "club"::text;
