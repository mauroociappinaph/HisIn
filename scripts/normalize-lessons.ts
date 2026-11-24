import { PrismaClient } from "@prisma/client";
import { loadLocalEnv } from "../src/shared/lib/load-env";
import { canonicalizeLessonContent, isCompleteLessonContent } from "../src/modules/lessons/structure";

loadLocalEnv();

const prisma = new PrismaClient();

/**
 * Rewrites stored lesson content into the canonical section structure.
 *
 * It is a dry run unless `--apply` is passed: rewriting learner-facing rows is
 * the only irreversible thing here, so it must be asked for explicitly.
 *
 * It only touches the `content` column, never deletes a row, and leaves content
 * it cannot parse as it is. Lessons that ship with the app are owned by
 * `src/modules/lessons/content.ts` and are rebuilt by `pnpm seed`; this script
 * exists for rows the seed does not know about (generated or hand-made).
 */
async function main() {
  const apply = process.argv.includes("--apply");
  const lessons = await prisma.lesson.findMany({
    select: { id: true, module: true, level: true, title: true, content: true },
  });

  const changes = lessons
    .map((lesson) => ({ id: lesson.id, title: lesson.title, before: lesson.content, after: canonicalizeLessonContent(lesson.content) }))
    .filter((change) => change.after !== change.before);

  if (!apply) {
    console.log(`Dry run: ${changes.length} de ${lessons.length} lecciones cambiarían. Nada se escribió.`);
    for (const change of changes) console.log(`  - ${change.title}`);
    console.log("Pasá --apply para escribir los cambios.");
    return;
  }

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
