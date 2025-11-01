/*
  Warnings:

  - You are about to drop the column `EditedAt` on the `Message` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Message" DROP COLUMN "EditedAt",
ADD COLUMN     "editedAt" TIMESTAMP(3);
