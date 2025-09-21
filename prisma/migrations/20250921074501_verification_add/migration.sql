-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "verificationCode" TEXT,
ADD COLUMN     "verificationExpires" TIMESTAMP(3);
