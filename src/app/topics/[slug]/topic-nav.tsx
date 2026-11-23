"use client";

import { useEffect, useState } from "react";

interface TopicNavItem {
  id: string;
  label: string;
}

/**
 * The steps of the lesson, as tabs above it.
 *
 * It used to be a sticky column on the right: it took a fifth of the screen away from
 * the teaching to repeat the nine steps, and on a laptop it pushed every card into a
 * narrow strip. As a horizontal strip the same navigation costs one row.
 *
 * The scroll spy marks the section crossing the reading line, not the one that happens
 * to be first in the viewport.
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
      { rootMargin: "-96px 0px -55% 0px", threshold: 0 },
    );

    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav aria-label="Steps of this lesson" className="-mx-1 overflow-x-auto pb-1">
      <ol className="flex gap-1.5 px-1">
        {items.map((item, index) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={active === item.id ? "true" : undefined}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs transition ${
                active === item.id
                  ? "bg-indigo-600 font-semibold text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
              }`}
            >
              <span className="text-[10px] tabular-nums opacity-70">{index + 1}</span>
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
