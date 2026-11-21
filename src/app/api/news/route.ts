import { NextResponse } from "next/server";
import { NewsRepository } from "@/modules/news/repository";
import { NEWS_FEEDS, newest, parseFeed, uniqueByUrl, type FeedItem } from "@/modules/news/feed";

export async function GET() {
  const repository = new NewsRepository();
  return NextResponse.json(await repository.list());
}

/**
 * Pulls the configured feeds and stores what is new.
 *
 * Feeds are independent: one timing out or rate limiting must not empty the
 * section, so each is fetched with its own budget and failures are reported, not
 * thrown.
 */
export async function POST() {
  const results = await Promise.allSettled(
    NEWS_FEEDS.map(async (feed) => {
      const response = await fetch(feed.url, {
        headers: { "user-agent": "HisIn/0.1 (+learning app)" },
        signal: AbortSignal.timeout(8000),
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`${feed.source}: HTTP ${response.status}`);
      return parseFeed(await response.text(), feed.source);
    }),
  );

  const items: FeedItem[] = [];
  const failed: string[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") items.push(...result.value);
    else failed.push(result.reason instanceof Error ? result.reason.message : String(result.reason));
  }

  const repository = new NewsRepository();
  const created = await repository.upsert(newest(uniqueByUrl(items), 40));

  return NextResponse.json({ created, failed, fetched: items.length });
}
