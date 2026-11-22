/**
 * RSS/Atom reading without a parser dependency.
 *
 * Feeds are small and the shapes are stable, so a contained extractor is enough
 * and it stays testable: no HTML parsing library, no XML library, no surprises in
 * the bundle.
 */
export interface FeedItem {
  title: string;
  url: string;
  source: string;
  publishedAt: string | null;
  excerpt: string;
}

export const NEWS_FEEDS = [
  { source: "Fierce Healthcare", url: "https://www.fiercehealthcare.com/rss/xml" },
  { source: "MobiHealthNews", url: "https://www.mobihealthnews.com/rss.xml" },
  { source: "TechCrunch Startups", url: "https://techcrunch.com/category/startups/feed/" },
  { source: "Sifted", url: "https://sifted.eu/feed" },
  { source: "STAT News", url: "https://www.statnews.com/feed/" },
] as const;

/**
 * Which feeds a discipline should read.
 *
 * "Noticias" is not one list for everyone: a health cohort needs FDA and
 * reimbursement coverage, a contracts cohort needs deal and liability news. The
 * default set stays as the fallback for disciplines without a specific press.
 */
const DISCIPLINE_SOURCES: Record<string, string[]> = {
  salud: ["Fierce Healthcare", "MobiHealthNews", "STAT News"],
  negocios: ["TechCrunch Startups", "Sifted", "STAT News"],
  derecho: ["Sifted", "TechCrunch Startups"],
  ingenieria: ["TechCrunch Startups", "Sifted"],
  lenguas: ["STAT News", "Sifted", "TechCrunch Startups", "Fierce Healthcare"],
};

export function feedsForDiscipline(discipline: string): typeof NEWS_FEEDS[number][] {
  const wanted = DISCIPLINE_SOURCES[discipline];
  if (!wanted) return [...NEWS_FEEDS];
  const selected = NEWS_FEEDS.filter((feed) => wanted.includes(feed.source));
  return selected.length > 0 ? selected : [...NEWS_FEEDS];
}

export function stripHtml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x([0-9a-f]+);/gi, (_match, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_match, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/\s+/g, " ")
    .trim();
}

function firstTag(block: string, tag: string): string | null {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return match?.[1] ? stripHtml(match[1]) : null;
}

function firstLink(block: string): string | null {
  const plain = firstTag(block, "link");
  if (plain && /^https?:\/\//.test(plain)) return plain;
  const href = block.match(/<link[^>]+href="([^"]+)"/i);
  return href?.[1] ?? null;
}

function firstDate(block: string): string | null {
  const raw = firstTag(block, "pubDate") ?? firstTag(block, "published") ?? firstTag(block, "updated");
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

/**
 * Extracts the items of one feed. A malformed or empty feed returns an empty
 * list instead of throwing: one dead feed must not stop the section from filling.
 */
export function parseFeed(xml: string, source: string): FeedItem[] {
  const blocks = xml.match(/<(item|entry)[\s>][\s\S]*?<\/\1>/gi) ?? [];
  const items: FeedItem[] = [];

  for (const block of blocks) {
    const title = firstTag(block, "title");
    const url = firstLink(block);
    if (!title || !url) continue;
    const excerpt = firstTag(block, "description") ?? firstTag(block, "summary") ?? firstTag(block, "content") ?? "";
    items.push({
      title,
      url,
      source,
      publishedAt: firstDate(block),
      excerpt: excerpt.slice(0, 1200),
    });
  }

  return items;
}

/** The same article often appears in two feeds; the URL is the identity. */
export function uniqueByUrl(items: FeedItem[]): FeedItem[] {
  const seen = new Set<string>();
  const out: FeedItem[] = [];
  for (const item of items) {
    const key = item.url.split("?")[0] ?? item.url;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/** Keeps the section readable: newest first, bounded. */
export function newest(items: FeedItem[], limit = 24): FeedItem[] {
  return [...items]
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))
    .slice(0, limit);
}
