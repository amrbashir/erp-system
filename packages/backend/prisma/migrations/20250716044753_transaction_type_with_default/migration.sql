-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INVOICE', 'EXPENSE', 'BALANCE_ADDITION');

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "type" "TransactionType" NOT NULL DEFAULT 'INVOICE';
