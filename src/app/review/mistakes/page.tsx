import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/shared/db/prisma";
import { getLocalUser } from "@/modules/identity/service";
import { MistakeDeck } from "./mistake-deck";

async function Deck() {
  const user = await getLocalUser();
  const rows = await prisma.mistake.findMany({
    where: { userId: user.id, resolved: false },
    orderBy: [{ nextReview: "asc" }, { createdAt: "desc" }],
    take: 60,
  });

  const due = rows.filter((row) => row.nextReview <= new Date());
  const deck = due.length > 0 ? due : rows;

  return (
    <MistakeDeck
      total={rows.length}
      mistakes={deck.map((row) => ({
        id: row.id,
        kind: row.kind,
        original: row.original,
        corrected: row.corrected,
        why: row.why,
        topicSlug: row.topicSlug,
      }))}
    />
  );
}

export default function MistakesPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-widest text-slate-500">Review</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Mistake deck</h1>
          <p className="max-w-prose text-sm text-slate-600">
            Built from your own writing: what the corrector found comes back until you stop making it.
          </p>
        </div>
        <Link
          href="/write"
          className="rounded-sm bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
        >
          Correct an email
        </Link>
      </header>

      <Suspense fallback={<div className="h-48 animate-pulse rounded-lg border border-slate-200 bg-white" />}>
        <Deck />
      </Suspense>
    </div>
  );
}
