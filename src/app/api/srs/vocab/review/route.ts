import { NextRequest, NextResponse } from "next/server";
import { getLocalUser } from "@/modules/identity/service";
import { reviewVocabulary } from "@/modules/vocabulary/srs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const vocabularyId = typeof body?.vocabularyId === "string" ? body.vocabularyId : "";
    const quality = body?.quality;

    if (!vocabularyId || typeof quality !== "number" || !Number.isInteger(quality)) {
      return NextResponse.json(
        { error: "vocabularyId and an integer quality are required" },
        { status: 400 },
      );
    }

    if (quality < 0 || quality > 5) {
      return NextResponse.json({ error: "quality must be between 0 and 5" }, { status: 400 });
    }

    const user = await getLocalUser();
    const result = await reviewVocabulary({ userId: user.id, vocabularyId, quality });
    return NextResponse.json(result);
  } catch (error) {
    console.error("SRS review error:", error);
    return NextResponse.json({ error: "Failed to process review" }, { status: 500 });
  }
}
