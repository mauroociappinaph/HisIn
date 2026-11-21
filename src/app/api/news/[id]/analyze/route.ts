import { NextRequest, NextResponse } from "next/server";
import { runGentleShell } from "@/modules/ai/gentle-shell";
import { resolveModels, resolveTimeoutMs } from "@/modules/ai/models";
import { buildNewsPrompt, NEWS_SYSTEM_PROMPT, parseNewsAnalysis } from "@/modules/news/analysis";
import { NewsRepository } from "@/modules/news/repository";

/**
 * Runs Gentle Shell over one article and keeps the extracted vocabulary and
 * patterns. Nothing is persisted unless the reply validates: an article with a
 * broken analysis stays unanalysed instead of showing invented content.
 */
export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const repository = new NewsRepository();
  const article = await repository.get(id);

  if (!article) return NextResponse.json({ error: "article not found" }, { status: 404 });

  const [model] = resolveModels();
  if (!model) return NextResponse.json({ error: "no model configured" }, { status: 500 });

  try {
    const response = await runGentleShell({
      prompt: buildNewsPrompt({
        title: article.title,
        source: article.source,
        excerpt: article.excerpt,
      }),
      system: NEWS_SYSTEM_PROMPT,
      model,
      timeoutMs: resolveTimeoutMs() * 2,
    });

    const analysis = parseNewsAnalysis(response.text);
    await repository.saveAnalysis(id, analysis);
    return NextResponse.json({ analysis, model: response.model });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
