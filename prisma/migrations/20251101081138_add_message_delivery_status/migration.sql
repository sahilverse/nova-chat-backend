-- CreateTable
CREATE TABLE "MessageDeliveryStatus" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'SENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessageDeliveryStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MessageDeliveryStatus_userId_status_idx" ON "MessageDeliveryStatus"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MessageDeliveryStatus_messageId_userId_key" ON "MessageDeliveryStatus"("messageId", "userId");

-- AddForeignKey
ALTER TABLE "MessageDeliveryStatus" ADD CONSTRAINT "MessageDeliveryStatus_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageDeliveryStatus" ADD CONSTRAINT "MessageDeliveryStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
