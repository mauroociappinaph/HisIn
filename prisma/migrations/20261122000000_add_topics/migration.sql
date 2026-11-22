-- CreateEnum
CREATE TYPE "TopicSkill" AS ENUM ('GRAMMAR', 'READING', 'LISTENING', 'WRITING');

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "ord" INTEGER NOT NULL DEFAULT 0,
    "level" "CefrLevel" NOT NULL,
    "focus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicMaterial" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "skill" "TopicSkill" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "keyPoints" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TopicMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Topic_slug_key" ON "Topic"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "TopicMaterial_topicId_skill_key" ON "TopicMaterial"("topicId", "skill");

-- CreateIndex
CREATE INDEX "TopicMaterial_topicId_idx" ON "TopicMaterial"("topicId");

-- AddForeignKey
ALTER TABLE "TopicMaterial" ADD CONSTRAINT "TopicMaterial_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
