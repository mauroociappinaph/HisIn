import { loadLocalEnv } from "../src/shared/lib/load-env";
loadLocalEnv();

async function main() {
  const { TopicRepository } = await import("../src/modules/topics/repository");
  const repo = new TopicRepository();
  await repo.ensureTopic({
    slug: "verb-to-be",
    title: "Verbo to be (afirmativo, negativo e interrogativo)",
    ord: 1,
    level: "A2",
    focus: "healthtech, emprendimiento y Silicon Valley",
  });
  console.log(JSON.stringify(await repo.findBySlug("verb-to-be"), null, 2).slice(0, 400));
}

void main();
