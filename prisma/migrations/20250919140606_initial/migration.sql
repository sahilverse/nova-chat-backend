-- CreateEnum
CREATE TYPE "public"."CallType" AS ENUM ('AUDIO', 'VIDEO');

-- CreateEnum
CREATE TYPE "public"."CallStatus" AS ENUM ('ONGOING', 'COMPLETED', 'MISSED');

-- CreateEnum
CREATE TYPE "public"."MessageType" AS ENUM ('TEXT', 'PHOTO', 'VIDEO', 'AUDIO');

-- CreateEnum
CREATE TYPE "public"."MessageStatus" AS ENUM ('SENT', 'DELIVERED', 'READ');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT,
    "profileImage" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSeen" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Chat" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "isGroup" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserChat" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "muted" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserChat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Message" (
    "id" TEXT NOT NULL,
    "type" "public"."MessageType" NOT NULL,
    "content" TEXT,
    "chatId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "replyToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Attachment" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "type" "public"."MessageType" NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MessageReaction" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MessageStatusEntry" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "public"."MessageStatus" NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessageStatusEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Call" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "initiatorId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "callType" "public"."CallType" NOT NULL,
    "callStatus" "public"."CallStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Call_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CallParticipants" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "CallParticipants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_CallParticipants" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CallParticipants_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "UserChat_userId_idx" ON "public"."UserChat"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserChat_chatId_userId_key" ON "public"."UserChat"("chatId", "userId");

-- CreateIndex
CREATE INDEX "Message_chatId_createdAt_idx" ON "public"."Message"("chatId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MessageReaction_messageId_userId_key" ON "public"."MessageReaction"("messageId", "userId");

-- CreateIndex
CREATE INDEX "MessageStatusEntry_messageId_userId_idx" ON "public"."MessageStatusEntry"("messageId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageStatusEntry_messageId_userId_key" ON "public"."MessageStatusEntry"("messageId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "CallParticipants_callId_userId_key" ON "public"."CallParticipants"("callId", "userId");

-- CreateIndex
CREATE INDEX "_CallParticipants_B_index" ON "public"."_CallParticipants"("B");

-- AddForeignKey
ALTER TABLE "public"."UserChat" ADD CONSTRAINT "UserChat_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserChat" ADD CONSTRAINT "UserChat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "public"."Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attachment" ADD CONSTRAINT "Attachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MessageReaction" ADD CONSTRAINT "MessageReaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MessageReaction" ADD CONSTRAINT "MessageReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MessageStatusEntry" ADD CONSTRAINT "MessageStatusEntry_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MessageStatusEntry" ADD CONSTRAINT "MessageStatusEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Call" ADD CONSTRAINT "Call_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Call" ADD CONSTRAINT "Call_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CallParticipants" ADD CONSTRAINT "CallParticipants_callId_fkey" FOREIGN KEY ("callId") REFERENCES "public"."Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CallParticipants" ADD CONSTRAINT "CallParticipants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_CallParticipants" ADD CONSTRAINT "_CallParticipants_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_CallParticipants" ADD CONSTRAINT "_CallParticipants_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
