CREATE TABLE "SearchExpansion" (
    "id" TEXT NOT NULL,
    "queryKey" TEXT NOT NULL,
    "keywords" TEXT[],
    "topics" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchExpansion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SearchExpansion_queryKey_key" ON "SearchExpansion"("queryKey");
