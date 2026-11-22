-- CreateTable
CREATE TABLE "StoryGloss" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "StoryGloss_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StoryGloss_topicId_idx" ON "StoryGloss"("topicId");

-- CreateIndex
CREATE UNIQUE INDEX "StoryGloss_topicId_term_key" ON "StoryGloss"("topicId", "term");

-- AddForeignKey
ALTER TABLE "StoryGloss" ADD CONSTRAINT "StoryGloss_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
