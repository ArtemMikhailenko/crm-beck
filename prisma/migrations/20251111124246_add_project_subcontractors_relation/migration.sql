-- CreateTable
CREATE TABLE "project_subcontractors" (
    "project_id" TEXT NOT NULL,
    "subcontractor_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_subcontractors_pkey" PRIMARY KEY ("project_id","subcontractor_id")
);

-- AddForeignKey
ALTER TABLE "project_subcontractors" ADD CONSTRAINT "project_subcontractors_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_subcontractors" ADD CONSTRAINT "project_subcontractors_subcontractor_id_fkey" FOREIGN KEY ("subcontractor_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
