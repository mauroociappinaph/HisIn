-- The owner asked to drop listening material and add a story per submodule.
-- Recreate the enum so LISTENING disappears instead of lingering unused.
DELETE FROM "TopicMaterial" WHERE "skill" = 'LISTENING';

ALTER TABLE "TopicMaterial" ALTER COLUMN "skill" TYPE TEXT;
DROP TYPE "TopicSkill";
CREATE TYPE "TopicSkill" AS ENUM ('GRAMMAR', 'READING', 'WRITING', 'STORY');
ALTER TABLE "TopicMaterial" ALTER COLUMN "skill" TYPE "TopicSkill" USING "skill"::"TopicSkill";
