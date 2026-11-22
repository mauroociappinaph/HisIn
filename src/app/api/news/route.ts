import { NextRequest, NextResponse } from "next/server";
import { paginate, parsePage, wantsPage } from "@/shared/lib/pagination";
import { NewsRepository } from "@/modules/news/repository";
import { feedsForDiscipline, newest, parseFeed, uniqueByUrl, type FeedItem } from "@/modules/news/feed";
import { getLocalUser } from "@/modules/identity/service";
import { ClassroomRepository } from "@/modules/classroom/repository";

export async function GET(req: NextRequest) {
  const params = new URL(req.url).searchParams;
  const repository = new NewsRepository();

  // Without limit/offset the response stays the plain array existing callers
  // read; with them it becomes a page with its real total.
  if (!wantsPage(params)) {
    return NextResponse.json(await repository.list());
  }

  const all = await repository.list(500);
  return NextResponse.json(paginate(all, parsePage(params)));
}

/**
 * Pulls the configured feeds and stores what is new.
 *
 * Feeds are independent: one timing out or rate limiting must not empty the
 * section, so each is fetched with its own budget and failures are reported, not
 * thrown.
 */
export async function POST() {
  const user = await getLocalUser();
  const design = await new ClassroomRepository().getDesign(user.id);
  const feeds = feedsForDiscipline(design.discipline);

  const results = await Promise.allSettled(
    feeds.map(async (feed) => {
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

  return NextResponse.json({ created, failed, fetched: items.length, discipline: design.discipline });
}
