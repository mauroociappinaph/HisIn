import { NextResponse } from "next/server";
import { getLocalUser } from "@/modules/identity/service";
import { getReviewStats } from "@/modules/vocabulary/srs";

export async function GET() {
  const user = await getLocalUser();
  const stats = await getReviewStats(user.id);
  return NextResponse.json(stats);
}
