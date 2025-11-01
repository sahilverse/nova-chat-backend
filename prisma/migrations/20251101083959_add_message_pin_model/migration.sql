/*
  Warnings:

  - You are about to drop the column `pinned` on the `UserChat` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserChat" DROP COLUMN "pinned";

-- CreateTable
CREATE TABLE "MessagePin" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pinnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessagePin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MessagePin_userId_idx" ON "MessagePin"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MessagePin_messageId_userId_key" ON "MessagePin"("messageId", "userId");

-- AddForeignKey
ALTER TABLE "MessagePin" ADD CONSTRAINT "MessagePin_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessagePin" ADD CONSTRAINT "MessagePin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
