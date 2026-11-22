import { prisma } from "@/shared/db/prisma";
import type { NewsAnalysis } from "./analysis";
import type { FeedItem } from "./feed";

export interface NewsDTO {
  id: string;
  title: string;
  url: string;
  source: string;
  excerpt: string;
  publishedAt: string | null;
  analyzed: boolean;
  analysis: NewsAnalysis | null;
}

/** Older rows stored the digest in Spanish; they are read as they are. */
function normalizeAnalysis(value: unknown): NewsAnalysis | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const summary = typeof raw.summary === "string" ? raw.summary : typeof raw.summaryEs === "string" ? raw.summaryEs : "";
  return { ...(raw as unknown as NewsAnalysis), summary };
}

export class NewsRepository {
  /** Stores the feed items that are new; re-syncing the same feed is a no-op. */
  async upsert(items: FeedItem[]): Promise<number> {
    if (items.length === 0) return 0;
    const result = await prisma.newsArticle.createMany({
      data: items.map((item) => ({
        url: item.url,
        title: item.title,
        source: item.source,
        excerpt: item.excerpt,
        publishedAt: item.publishedAt ? new Date(item.publishedAt) : null,
      })),
      skipDuplicates: true,
    });
    return result.count;
  }

  async list(limit = 24): Promise<NewsDTO[]> {
    const rows = await prisma.newsArticle.findMany({
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: limit,
    });
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      url: row.url,
      source: row.source,
      excerpt: row.excerpt,
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
      analyzed: row.analyzedAt !== null,
      analysis: normalizeAnalysis(row.analysis),
    }));
  }

  async get(id: string) {
    return prisma.newsArticle.findUnique({ where: { id } });
  }

  async saveAnalysis(id: string, analysis: NewsAnalysis) {
    return prisma.newsArticle.update({
      where: { id },
      data: { analysis: analysis as unknown as object, analyzedAt: new Date() },
    });
  }
}
