-- CreateEnum
CREATE TYPE "VocabularyKind" AS ENUM ('WORD', 'PHRASAL_VERB', 'PATTERN');

-- CreateEnum
CREATE TYPE "VocabularySource" AS ENUM ('SEED', 'GENERATED', 'USER');

-- AlterTable
ALTER TABLE "Vocabulary"
    ADD COLUMN "kind" "VocabularyKind" NOT NULL DEFAULT 'WORD',
    ADD COLUMN "particle" TEXT,
    ADD COLUMN "source" "VocabularySource" NOT NULL DEFAULT 'SEED',
    ADD COLUMN "extraExample" TEXT,
    ADD COLUMN "notes" TEXT;

-- Facts already known: seeded rows were written with a "seed_" id prefix, so
-- everything else in the table came from the generation engine.
UPDATE "Vocabulary" SET "source" = 'GENERATED' WHERE "id" NOT LIKE 'seed_%';

-- CreateIndex
CREATE INDEX "Vocabulary_kind_idx" ON "Vocabulary"("kind");
