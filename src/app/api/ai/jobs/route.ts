import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/modules/ai/guard";
import { listJobs } from "@/modules/ai/repository";

export async function GET(req: NextRequest) {
  if (!isAuthorized(req.headers)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const requested = Number(searchParams.get("limit") ?? "20");
  const limit = Number.isFinite(requested) ? Math.min(Math.max(Math.trunc(requested), 1), 50) : 20;

  const jobs = await listJobs(limit);
  return NextResponse.json(jobs);
}
