-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('USER', 'ADMIN');

-- AlterTable
ALTER TABLE "public"."Creator" ADD COLUMN     "role" "public"."Role" NOT NULL DEFAULT 'USER';
