/*
  Warnings:

  - You are about to drop the column `storeId` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `storeId` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `storeId` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `storeId` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the `stores` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "expenses" DROP CONSTRAINT "expenses_storeId_fkey";

-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_storeId_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_storeId_fkey";

-- DropForeignKey
ALTER TABLE "stores" DROP CONSTRAINT "stores_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_storeId_fkey";

-- AlterTable
ALTER TABLE "expenses" DROP COLUMN "storeId";

-- AlterTable
ALTER TABLE "invoices" DROP COLUMN "storeId";

-- AlterTable
ALTER TABLE "products" DROP COLUMN "storeId";

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "storeId";

-- DropTable
DROP TABLE "stores";
