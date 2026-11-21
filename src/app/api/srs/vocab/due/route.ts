import { NextRequest, NextResponse } from "next/server";
import { getLocalUser } from "@/modules/identity/service";
import { getDueReviews } from "@/modules/vocabulary/srs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const requested = Number(searchParams.get("limit") ?? "20");
  const limit = Number.isFinite(requested) ? Math.min(Math.max(Math.trunc(requested), 1), 100) : 20;

  const user = await getLocalUser();
  const reviews = await getDueReviews(user.id, limit);

  return NextResponse.json(reviews);
}
