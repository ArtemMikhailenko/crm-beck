/*
  Warnings:

  - You are about to drop the column `approver_id` on the `vacations` table. All the data in the column will be lost.
  - You are about to drop the column `comment` on the `vacations` table. All the data in the column will be lost.
  - Added the required column `updated_at` to the `vacations` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNING', 'REVIEW', 'PROCESS', 'PAUSE', 'REUSE', 'COMPLETED', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "VacationStatus" ADD VALUE 'PENDING';
ALTER TYPE "VacationStatus" ADD VALUE 'CANCELLED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "VacationType" ADD VALUE 'ANNUAL';
ALTER TYPE "VacationType" ADD VALUE 'MATERNITY';
ALTER TYPE "VacationType" ADD VALUE 'PATERNITY';
ALTER TYPE "VacationType" ADD VALUE 'STUDY';
ALTER TYPE "VacationType" ADD VALUE 'EMERGENCY';

-- AlterTable
ALTER TABLE "time_entries" ADD COLUMN     "projectId" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "description" VARCHAR(1000),
ADD COLUMN     "rate_per_hour" DECIMAL(10,2),
ADD COLUMN     "rate_per_linear_meter" DECIMAL(10,2),
ADD COLUMN     "rate_per_m2" DECIMAL(10,2),
ADD COLUMN     "work_schedule" JSONB,
ADD COLUMN     "work_types" TEXT[];

-- AlterTable
ALTER TABLE "vacations" DROP COLUMN "approver_id",
DROP COLUMN "comment",
ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "approved_by_id" TEXT,
ADD COLUMN     "calendar_days" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "covering_user_id" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "emergency_contact" VARCHAR(200),
ADD COLUMN     "manager_comment" VARCHAR(1000),
ADD COLUMN     "reason" VARCHAR(1000),
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "working_days" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "manager_id" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNING',
    "description" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_contacts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "phone" VARCHAR(64),
    "email" VARCHAR(200),
    "relation" VARCHAR(100),
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_vacations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "description" VARCHAR(1000),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_vacations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_alert_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "alert_type" VARCHAR(100) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_alert_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "projects_project_id_key" ON "projects"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_alert_settings_user_id_alert_type_category_key" ON "user_alert_settings"("user_id", "alert_type", "category");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacations" ADD CONSTRAINT "vacations_covering_user_id_fkey" FOREIGN KEY ("covering_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacations" ADD CONSTRAINT "vacations_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_contacts" ADD CONSTRAINT "user_contacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_vacations" ADD CONSTRAINT "user_vacations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_alert_settings" ADD CONSTRAINT "user_alert_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
