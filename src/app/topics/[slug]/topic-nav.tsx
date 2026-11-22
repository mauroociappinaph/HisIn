"use client";

import { useEffect, useState } from "react";

interface TopicNavItem {
  id: string;
  label: string;
}

/**
 * "On this page" for a lesson that is long enough to get lost in.
 *
 * Research on long-form lesson pages agrees on three things: a sticky table of
 * contents that marks where you are, a position in the sequence, and a Next
 * control that never requires scrolling back to the top. This is the first one;
 * the page renders the other two.
 *
 * The scroll spy marks the section under the reading line, not the one that
 * happens to be first in the viewport, so the highlighted item matches what the
 * learner is actually reading.
 */
export function TopicNav({ items }: { items: TopicNavItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => Boolean(element));
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      // A band near the top of the viewport: the section you are reading is the
      // one crossing it, not the one that just appeared at the bottom.
      { rootMargin: "-96px 0px -55% 0px", threshold: 0 },
    );

    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, [items]);

  return (
    <>
      {/* Mobile: a strip of chips you can thumb through. A stacked card list at
          the top of a phone screen pushes the lesson below the fold, which is
          exactly the "horrible" the owner saw. */}
      <nav aria-label="On this page" className="min-w-0 max-w-full overflow-x-auto lg:hidden">
        <ol className="flex gap-1.5 px-1">
          {items.map((item, index) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={active === item.id ? "true" : undefined}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs transition ${
                  active === item.id
                    ? "bg-indigo-600 text-white font-semibold"
                    : "bg-white border border-slate-200 text-slate-600"
                }`}
              >
                <span className="text-[10px] tabular-nums opacity-70">{index + 1}</span>
                {item.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <nav
        aria-label="On this page"
        className="hidden lg:block lg:sticky lg:top-20 self-start rounded-lg bg-white border border-slate-200 p-3"
      >
      <p className="px-2 pb-2 text-[11px] uppercase tracking-widest text-slate-500">On this page</p>
      <ol className="space-y-0.5">
        {items.map((item, index) => {
          const current = active === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={current ? "true" : undefined}
                className={`flex items-center gap-2 rounded-sm px-2 py-1.5 text-xs transition ${
                  current
                    ? "bg-indigo-50 text-indigo-800 font-semibold"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span
                  className={`w-5 text-[10px] tabular-nums ${current ? "text-indigo-600" : "text-slate-400"}`}
                >
                  {index + 1}
                </span>
                {item.label}
              </a>
            </li>
          );
        })}
      </ol>
      </nav>
    </>
  );
}
