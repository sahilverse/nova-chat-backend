/*
  Warnings:

  - The values [LOCATION,CONTACT,STICKER] on the enum `MessageType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."MessageType_new" AS ENUM ('TEXT', 'PHOTO', 'VIDEO', 'AUDIO');
ALTER TABLE "public"."Message" ALTER COLUMN "type" TYPE "public"."MessageType_new" USING ("type"::text::"public"."MessageType_new");
ALTER TABLE "public"."Attachment" ALTER COLUMN "type" TYPE "public"."MessageType_new" USING ("type"::text::"public"."MessageType_new");
ALTER TYPE "public"."MessageType" RENAME TO "MessageType_old";
ALTER TYPE "public"."MessageType_new" RENAME TO "MessageType";
DROP TYPE "public"."MessageType_old";
COMMIT;
