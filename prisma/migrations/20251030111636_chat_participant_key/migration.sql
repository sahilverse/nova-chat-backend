/*
  Warnings:

  - A unique constraint covering the columns `[participantKey]` on the table `Chat` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Chat" ADD COLUMN     "participantKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Chat_participantKey_key" ON "public"."Chat"("participantKey");
