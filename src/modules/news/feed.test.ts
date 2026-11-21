import assert from "node:assert/strict";
import { test } from "node:test";
import { newest, parseFeed, stripHtml, uniqueByUrl } from "./feed";

const rss = `<?xml version="1.0"?>
<rss version="2.0"><channel><title>Feed</title>
<item>
  <title><![CDATA[Digital health funding cools in Q3]]></title>
  <link>https://example.com/funding-q3</link>
  <pubDate>Tue, 03 Nov 2026 10:00:00 GMT</pubDate>
  <description><![CDATA[<p>Investors pulled back from <b>telehealth</b> deals.</p>]]></description>
</item>
<item>
  <title>FDA clears remote monitoring device</title>
  <link>https://example.com/fda-clearance?utm=feed</link>
  <pubDate>Mon, 02 Nov 2026 09:00:00 GMT</pubDate>
  <description>The agency granted clearance for a wearable.</description>
</item>
</channel></rss>`;

const atom = `<feed><entry>
  <title>Startup raises Series B</title>
  <link href="https://example.com/series-b"/>
  <updated>2026-11-04T08:00:00Z</updated>
  <summary>The round was led by a European fund.</summary>
</entry></feed>`;

test("an RSS channel yields its items with source, link and date", () => {
  const items = parseFeed(rss, "Example");

  assert.equal(items.length, 2);
  assert.equal(items[0]?.title, "Digital health funding cools in Q3");
  assert.equal(items[0]?.url, "https://example.com/funding-q3");
  assert.equal(items[0]?.source, "Example");
  assert.equal(items[0]?.publishedAt, "2026-11-03T10:00:00.000Z");
});

test("CDATA and inline markup are stripped from the excerpt", () => {
  const items = parseFeed(rss, "Example");

  assert.equal(items[0]?.excerpt, "Investors pulled back from telehealth deals.");
  assert.equal(items[1]?.excerpt, "The agency granted clearance for a wearable.");
});

test("an Atom entry is parsed too", () => {
  const items = parseFeed(atom, "Example");

  assert.equal(items.length, 1);
  assert.equal(items[0]?.url, "https://example.com/series-b");
  assert.equal(items[0]?.publishedAt, "2026-11-04T08:00:00.000Z");
});

test("an empty or broken feed returns no items instead of throwing", () => {
  assert.deepEqual(parseFeed("", "Example"), []);
  assert.deepEqual(parseFeed("<html><body>rate limited</body></html>", "Example"), []);
});

test("an item without a title or a link is skipped", () => {
  const broken = `<rss><channel><item><description>orphan</description></item></channel></rss>`;

  assert.deepEqual(parseFeed(broken, "Example"), []);
});

test("the same article arriving twice keeps one copy", () => {
  const items = parseFeed(rss, "Example");
  const duplicated = [...items, ...items.map((item) => ({ ...item, source: "Other" }))];

  assert.equal(uniqueByUrl(duplicated).length, 2);
});

test("tracking parameters do not defeat deduplication", () => {
  const [first, second] = parseFeed(rss, "Example");
  assert.ok(first && second);
  const withTracking = { ...second, url: `${second.url}&utm_source=x` };

  assert.equal(uniqueByUrl([second, withTracking]).length, 1);
});

test("the newest items come first and the list stays bounded", () => {
  const items = parseFeed(rss, "Example");
  const sorted = newest(items, 1);

  assert.equal(sorted.length, 1);
  assert.equal(sorted[0]?.title, "Digital health funding cools in Q3");
});

test("HTML entities are decoded, including numeric ones", () => {
  assert.equal(stripHtml("R&amp;D &quot;spend&quot;"), 'R&D "spend"');
  assert.equal(stripHtml("Capricor&#8217;s therapy"), "Capricor\u2019s therapy");
  assert.equal(stripHtml("caf&#xe9;"), "caf\u00e9");
});
