-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bankSenderEmail" TEXT,
ADD COLUMN     "bankSenderVerified" BOOLEAN NOT NULL DEFAULT false;
