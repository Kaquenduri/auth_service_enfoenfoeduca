-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "auth_schema";

-- CreateEnum
CREATE TYPE "auth_schema"."UserState" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "auth_schema"."RoleName" AS ENUM ('ADMIN', 'STUDENT', 'TEACHER', 'PARENT');

-- CreateTable
CREATE TABLE "auth_schema"."User" (
    "user_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "state" "auth_schema"."UserState" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "auth_schema"."UserRole" (
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("role_id","user_id")
);

-- CreateTable
CREATE TABLE "auth_schema"."Role" (
    "role_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" "auth_schema"."RoleName" NOT NULL DEFAULT 'STUDENT',

    CONSTRAINT "Role_pkey" PRIMARY KEY ("role_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "auth_schema"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "auth_schema"."Role"("name");

-- AddForeignKey
ALTER TABLE "auth_schema"."UserRole" ADD CONSTRAINT "UserRole_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth_schema"."User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_schema"."UserRole" ADD CONSTRAINT "UserRole_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "auth_schema"."Role"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;
