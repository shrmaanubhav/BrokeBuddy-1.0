/*
  Warnings:

  - A unique constraint covering the columns `[userId,source,upiReference]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Transaction_userId_source_amount_transactionDate_upiId_key";

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "upiReference" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_userId_source_upiReference_key" ON "Transaction"("userId", "source", "upiReference");
