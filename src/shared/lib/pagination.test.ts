import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_LIMIT, MAX_LIMIT, paginate, parsePage, wantsPage } from "./pagination";

const items = Array.from({ length: 45 }, (_value, index) => index);

test("pagination reports the real total, not the page size", () => {
  const page = paginate(items, { limit: 10, offset: 0 });

  assert.equal(page.items.length, 10);
  assert.equal(page.total, 45);
  assert.equal(page.hasMore, true);
});

test("the last page says there is nothing more", () => {
  const page = paginate(items, { limit: 10, offset: 40 });

  assert.equal(page.items.length, 5);
  assert.equal(page.hasMore, false);
});

test("an offset past the end returns an empty page instead of throwing", () => {
  const page = paginate(items, { limit: 10, offset: 500 });

  assert.deepEqual(page.items, []);
  assert.equal(page.hasMore, false);
  assert.equal(page.total, 45);
});

test("the query string is clamped so a caller cannot ask for everything", () => {
  assert.deepEqual(parsePage(new URLSearchParams("limit=9999&offset=-5")), {
    limit: MAX_LIMIT,
    offset: 0,
  });
  assert.deepEqual(parsePage(new URLSearchParams("limit=0")), { limit: 1, offset: 0 });
  assert.deepEqual(parsePage(new URLSearchParams("limit=abc&offset=xyz")), {
    limit: DEFAULT_LIMIT,
    offset: 0,
  });
});

test("no parameters means the default page, and no pagination was requested", () => {
  const params = new URLSearchParams("");

  assert.deepEqual(parsePage(params), { limit: DEFAULT_LIMIT, offset: 0 });
  assert.equal(wantsPage(params), false);
  assert.equal(wantsPage(new URLSearchParams("limit=5")), true);
});

test("pages tile the list without gaps or repeats", () => {
  const seen: number[] = [];
  for (let offset = 0; offset < items.length; offset += 7) {
    seen.push(...paginate(items, { limit: 7, offset }).items);
  }

  assert.deepEqual(seen, items);
});
