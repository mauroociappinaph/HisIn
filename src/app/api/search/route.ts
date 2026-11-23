import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/shared/db/prisma";
import { getLocalUser } from "@/modules/identity/service";
import { TopicRepository } from "@/modules/topics/repository";
import { groupHits, searchDocuments, type SearchDocument, type SearchHit } from "@/modules/search/search";
import {
  EXPANSION_SYSTEM_PROMPT,
  buildExpansionPrompt,
  expansionKey,
  knownTopics,
  needsExpansion,
  parseExpansion,
  type Expansion,
} from "@/modules/search/hybrid";
import { runWithFallback } from "@/modules/ai/with-fallback";
import { resolveTimeoutMs } from "@/modules/ai/models";

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

  let hits = searchDocuments(query, documents, 30);
  let used: Expansion | null = null;

  // Second chance: when the lexical pass is thin, ask the engine what to look for,
  // then search again with its words. The expansion is cached per question.
  if (needsExpansion(hits)) {
    used = await expand(query, topics);
    if (used) {
      const boosted = await searchWithExpansion(query, used, documents, hits);
      if (boosted.length > 0) hits = boosted;
    }
  }

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

  return NextResponse.json({
    query,
    total: hits.length,
    expanded: used ? { keywords: used.keywords, topics: used.topics } : null,
    groups,
  });
}

/** Reads the cached expansion, or asks the engine once and stores it. */
async function expand(query: string, topics: { slug: string; title: string }[]): Promise<Expansion | null> {
  const queryKey = expansionKey(query);
  const cached = await prisma.searchExpansion.findUnique({ where: { queryKey } });
  if (cached) return { keywords: cached.keywords, topics: cached.topics };

  try {
    const response = await runWithFallback({
      prompt: buildExpansionPrompt({ query, topics }).slice(0, 6000),
      system: EXPANSION_SYSTEM_PROMPT,
      timeoutMs: resolveTimeoutMs() * 2,
    });
    const parsed = parseExpansion(response.text);
    const expansion: Expansion = { keywords: parsed.keywords, topics: knownTopics(parsed, topics.map((topic) => topic.slug)) };

    await prisma.searchExpansion.create({
      data: { queryKey, keywords: expansion.keywords, topics: expansion.topics },
    });
    return expansion;
  } catch {
    // A failed expansion must not fail the search: the lexical pass already ran.
    return null;
  }
}

/** Second pass with the engine's words, and the lessons it named pushed up. */
async function searchWithExpansion(
  query: string,
  expansion: Expansion,
  documents: SearchDocument[],
  lexical: SearchHit[],
): Promise<SearchHit[]> {
  // The engine's words are searched on their own: piling them onto the original
  // question dilutes the coverage and returns nothing.
  const widened = searchDocuments(expansion.keywords.join(" "), documents, 30, { minCoverage: 0.34 });

  // Union, not replacement: the lexical hits that were already good stay.
  const merged = new Map<string, SearchHit>();
  for (const hit of [...lexical, ...widened]) {
    const previous = merged.get(hit.document.id);
    if (!previous || hit.score > previous.score) merged.set(hit.document.id, hit);
  }

  return [...merged.values()]
    .map((hit) =>
      expansion.topics.some((slug) => hit.document.href === `/topics/${slug}`)
        ? { ...hit, score: hit.score * 1.8 }
        : hit,
    )
    .sort((first, second) => second.score - first.score);
}
