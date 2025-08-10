-- AlterTable
ALTER TABLE "public"."sessions"
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL DEFAULT (now() + INTERVAL '1 day'),
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "userAgent" TEXT;

-- Drop the default so the field remains required without a default for future inserts
ALTER TABLE "public"."sessions" ALTER COLUMN "expiresAt" DROP DEFAULT;
