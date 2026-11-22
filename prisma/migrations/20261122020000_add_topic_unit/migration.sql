ALTER TABLE "Topic"
    ADD COLUMN "unit" TEXT,
    ADD COLUMN "unitOrder" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "Topic_unitOrder_ord_idx" ON "Topic"("unitOrder", "ord");
