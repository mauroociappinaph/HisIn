import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/shared/db/prisma";
import { getLocalUser } from "@/modules/identity/service";
import { TopicRepository } from "@/modules/topics/repository";
import { groupHits, searchDocuments, type SearchDocument } from "@/modules/search/search";

/**
 * Everything the course knows, searched at once.
 *
 * Lessons, the terms of every story, the learner's own vocabulary, their mistakes
 * and the analysed news, in one ranked list. The documents are built per request
 * from the database, which keeps the index honest: a mistake you just filed is
 * searchable immediately.
 */
export async function GET(req: NextRequest) {
  const query = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) return NextResponse.json({ query, groups: [], total: 0 });

  const user = await getLocalUser();
  const topics = await new TopicRepository().list();

  const [glosses, words, mistakes, news] = await Promise.all([
    prisma.storyGloss.findMany({ select: { term: true, translation: true, kind: true, topic: { select: { slug: true } } } }),
    prisma.vocabulary.findMany({
      select: { id: true, term: true, definition: true, example: true, level: true },
      take: 400,
    }),
    prisma.mistake.findMany({
      where: { userId: user.id, resolved: false },
      select: { id: true, original: true, corrected: true, why: true },
      take: 200,
    }),
    prisma.newsArticle.findMany({ select: { id: true, title: true, excerpt: true, url: true }, take: 100 }),
  ]);

  const documents: SearchDocument[] = [
    ...topics.map((topic) => ({
      id: `topic:${topic.slug}`,
      kind: "topic" as const,
      title: topic.title,
      body: [topic.prologue ?? "", ...topic.materials.map((material) => `${material.title} ${material.body}`), ...topic.glosses.map((gloss) => gloss.translation)]
        .join(" ")
        .slice(0, 4000),
      href: `/topics/${topic.slug}`,
      meta: topic.unit ?? undefined,
      level: topic.level,
    })),
    ...glosses.map((gloss) => ({
      id: `term:${gloss.topic.slug}:${gloss.term}`,
      kind: "term" as const,
      title: gloss.term,
      body: `${gloss.translation} ${gloss.kind}`,
      href: `/topics/${gloss.topic.slug}`,
      meta: gloss.kind,
    })),
    ...words.map((word) => ({
      id: `word:${word.id}`,
      kind: "word" as const,
      title: word.term,
      body: `${word.definition} ${word.example}`,
      href: "/library",
      meta: "your vocabulary",
      level: word.level ?? undefined,
    })),
    ...mistakes.map((mistake) => ({
      id: `mistake:${mistake.id}`,
      kind: "mistake" as const,
      title: mistake.original,
      body: `${mistake.corrected} ${mistake.why}`,
      href: "/review/mistakes",
      meta: "your mistake",
    })),
    ...news.map((article) => ({
      id: `news:${article.id}`,
      kind: "news" as const,
      title: article.title,
      body: article.excerpt ?? "",
      href: article.url,
      meta: "news",
    })),
    ...topics.flatMap((topic) =>
      topic.materials
        .filter((material) => material.skill === "STORY")
        .map((material) => ({
          id: `story:${topic.slug}`,
          kind: "story" as const,
          title: material.title,
          body: material.body,
          href: `/topics/${topic.slug}`,
          meta: topic.title,
          level: topic.level,
        })),
    ),
  ];

  const hits = searchDocuments(query, documents, 30);
  const groups = groupHits(hits).map((group) => ({
    kind: group.kind,
    label: group.label,
    hits: group.hits.map((hit) => ({
      id: hit.document.id,
      title: hit.document.title,
      href: hit.document.href,
      meta: hit.document.meta ?? null,
      level: hit.document.level ?? null,
      preview: hit.document.body.slice(0, 160),
      score: Math.round(hit.score * 10) / 10,
    })),
  }));

  return NextResponse.json({ query, total: hits.length, groups });
}
