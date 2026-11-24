import { PrismaClient } from "@prisma/client";
import { loadLocalEnv } from "../src/shared/lib/load-env";
import { canonicalizeLessonContent, isCompleteLessonContent } from "../src/modules/lessons/structure";
import { authoredLessonContent } from "../src/modules/lessons/legacy-content";

loadLocalEnv();

const prisma = new PrismaClient();

/**
 * Rewrites every stored lesson into the canonical section structure.
 *
 * It only rewrites the `content` column, it never deletes a row, and content it
 * cannot parse is left as it is. Running it twice is a no-op, which is what makes
 * it safe to run against a database that already has learner-facing lessons.
 *
 * A lesson with authored sections (`legacy-content.ts`) gets those; the rest are
 * normalized by their own markers. "Sin cambios" is not the same as "completa":
 * a legacy lesson still written as prose is listed instead of counted as done.
 */
async function main() {
  const lessons = await prisma.lesson.findMany({
    select: { id: true, module: true, level: true, title: true, content: true },
  });

  const changes = lessons
    .map((lesson) => ({
      id: lesson.id,
      before: lesson.content,
      after:
        authoredLessonContent(lesson.module, lesson.level, lesson.title) ??
        canonicalizeLessonContent(lesson.content),
    }))
    .filter((change) => change.after !== change.before);

  if (changes.length > 0) {
    await prisma.$transaction(
      changes.map((change) =>
        prisma.lesson.update({ where: { id: change.id }, data: { content: change.after } }),
      ),
    );
  }

  const rewritten = new Map(changes.map((change) => [change.id, change.after]));
  const incomplete = lessons
    .map((lesson) => ({ title: lesson.title, content: rewritten.get(lesson.id) ?? lesson.content }))
    .filter((lesson) => !isCompleteLessonContent(lesson.content));

  console.log(
    `${changes.length} de ${lessons.length} lecciones reescritas; ${lessons.length - changes.length} quedaron sin cambios.`,
  );
  if (incomplete.length > 0) {
    console.log(`${incomplete.length} lección(es) todavía no tienen las cinco secciones y necesitan contenido:`);
    for (const lesson of incomplete) console.log(`  - ${lesson.title}`);
  } else {
    console.log("Todas las lecciones tienen las cinco secciones.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
