import { NextRequest, NextResponse } from "next/server";
import { TopicRepository } from "@/modules/topics/repository";

export async function GET(_req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const topic = await new TopicRepository().findBySlug(slug);
  if (!topic) return NextResponse.json({ error: "tema no encontrado" }, { status: 404 });
  return NextResponse.json(topic);
}
