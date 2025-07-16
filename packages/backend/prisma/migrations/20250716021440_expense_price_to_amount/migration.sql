/*
  Warnings:

  - You are about to drop the column `price` on the `expenses` table. All the data in the column will be lost.
  - Added the required column `amount` to the `expenses` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "expenses" DROP COLUMN "price",
ADD COLUMN     "amount" DECIMAL(20,4) NOT NULL;
