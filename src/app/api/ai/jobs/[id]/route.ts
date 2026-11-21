import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/modules/ai/guard";
import { getJob } from "@/modules/ai/repository";
import { toJobPayload } from "@/modules/ai/service";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req.headers)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const job = await getJob(id);
  if (!job) {
    return NextResponse.json({ error: "job not found" }, { status: 404 });
  }

  return NextResponse.json(toJobPayload(job));
}
