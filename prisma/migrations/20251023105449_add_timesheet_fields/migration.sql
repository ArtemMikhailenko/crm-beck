/*
  Warnings:

  - Added the required column `week_end_date` to the `timesheets` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "timesheets" ADD COLUMN     "total_hours" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "week_end_date" TIMESTAMP(3) NOT NULL;
