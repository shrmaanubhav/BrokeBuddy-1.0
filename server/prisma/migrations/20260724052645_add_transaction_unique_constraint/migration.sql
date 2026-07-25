/*
  Warnings:

  - A unique constraint covering the columns `[userId,source,amount,transactionDate,upiId]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Transaction_userId_source_amount_transactionDate_upiId_key" ON "Transaction"("userId", "source", "amount", "transactionDate", "upiId");
