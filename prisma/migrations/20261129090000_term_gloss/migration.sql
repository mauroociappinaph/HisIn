CREATE TABLE "TermGloss" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TermGloss_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TermGloss_key_key" ON "TermGloss"("key");
CREATE INDEX "TermGloss_kind_idx" ON "TermGloss"("kind");
