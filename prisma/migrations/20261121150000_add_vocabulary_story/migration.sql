-- CreateTable
CREATE TABLE "VocabularyStory" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "level" "CefrLevel" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "targetWords" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VocabularyStory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VocabularyStory_module_level_title_key" ON "VocabularyStory"("module", "level", "title");

-- CreateIndex
CREATE INDEX "VocabularyStory_module_level_idx" ON "VocabularyStory"("module", "level");
