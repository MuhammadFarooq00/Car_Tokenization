-- AlterTable: add onboardingCompleted and pendingRoles columns to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "pendingRoles" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
