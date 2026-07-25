/*
  Warnings:

  - You are about to drop the column `passwordHash` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `TempUser` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `googleId` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "User_email_idx";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "passwordHash",
ALTER COLUMN "googleId" SET NOT NULL;

-- DropTable
DROP TABLE "TempUser";
