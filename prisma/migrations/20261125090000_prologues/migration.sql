-- AlterTable
ALTER TABLE "Topic" ADD COLUMN "prologue" TEXT;

-- CreateTable
CREATE TABLE "UnitMeta" (
    "id" TEXT NOT NULL,
    "unitOrder" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "prologue" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnitMeta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UnitMeta_unitOrder_key" ON "UnitMeta"("unitOrder");
