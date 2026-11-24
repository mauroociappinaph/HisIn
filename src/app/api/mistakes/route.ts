import { NextResponse } from "next/server";
import { prisma } from "@/shared/db/prisma";
import { getLocalUser } from "@/modules/identity/service";

/** The mistakes due today, newest scheduling first. */
export async function GET() {
  const user = await getLocalUser();
  const rows = await prisma.mistake.findMany({
    where: { userId: user.id, resolved: false },
    orderBy: [{ nextReview: "asc" }, { createdAt: "desc" }],
    take: 60,
  });

  const due = rows.filter((row) => row.nextReview <= new Date());
  return NextResponse.json({ due: due.length, total: rows.length, mistakes: due.length > 0 ? due : rows });
}
