/*
  Warnings:

  - You are about to drop the column `gmailRefreshToken` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "gmailRefreshToken",
ADD COLUMN     "googleRefreshToken" TEXT;
