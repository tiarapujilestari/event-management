-- This migration was already applied directly to the shared Neon database
-- in an earlier session. This file exists so the migration history matches
-- what the database already has — it is NOT meant to be re-run against data,
-- only registered via `prisma migrate resolve --applied`.

-- Add WAITING_CONFIRMATION to the TransactionStatus enum
ALTER TYPE "TransactionStatus" ADD VALUE IF NOT EXISTS 'WAITING_CONFIRMATION';

-- Drop Midtrans-specific columns from payments
ALTER TABLE "payments" DROP COLUMN IF EXISTS "midtransOrderId";
ALTER TABLE "payments" DROP COLUMN IF EXISTS "paymentUrl";
ALTER TABLE "payments" DROP COLUMN IF EXISTS "rawResponse";

-- Add proofUrl for the manual bank-transfer proof upload flow
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "proofUrl" TEXT;

-- paymentMethod becomes required with a default
ALTER TABLE "payments" ALTER COLUMN "paymentMethod" SET DEFAULT 'BANK_TRANSFER';
UPDATE "payments" SET "paymentMethod" = 'BANK_TRANSFER' WHERE "paymentMethod" IS NULL;
ALTER TABLE "payments" ALTER COLUMN "paymentMethod" SET NOT NULL;
