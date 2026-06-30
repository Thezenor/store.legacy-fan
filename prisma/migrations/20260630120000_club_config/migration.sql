-- AlterTable
ALTER TABLE "MembershipPlan" ADD COLUMN     "launchDate" TIMESTAMP(3),
ADD COLUMN     "reservationEurCents" INTEGER,
ADD COLUMN     "reservationUsdCents" INTEGER,
ADD COLUMN     "tagline" TEXT;

