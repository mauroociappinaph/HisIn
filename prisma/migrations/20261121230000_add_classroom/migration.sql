-- AlterTable
ALTER TABLE "LearnerProfile"
    ADD COLUMN "discipline" TEXT NOT NULL DEFAULT 'negocios',
    ADD COLUMN "educationLevel" TEXT NOT NULL DEFAULT 'grado_inicial',
    ADD COLUMN "classMinutes" INTEGER NOT NULL DEFAULT 60,
    ADD COLUMN "sequence" TEXT NOT NULL DEFAULT 'semanal';

-- CreateTable
CREATE TABLE "ClassPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "discipline" TEXT NOT NULL,
    "educationLevel" TEXT NOT NULL,
    "minutes" INTEGER NOT NULL,
    "sequence" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "flow" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClassPlan_userId_createdAt_idx" ON "ClassPlan"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "ClassPlan" ADD CONSTRAINT "ClassPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "LearnerProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
