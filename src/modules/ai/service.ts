import { runGentleShell, DEFAULT_MODEL } from "./gentle-shell";
import { buildQuestionPrompt, buildSystemPrompt } from "./prompt";
import { createJob, markFailed, markRunning, markSucceeded, persistQuestions } from "./repository";
import { parseGeneratedBatch, type GeneratedQuestion, type QuestionRequest } from "./schema";

export interface GenerationOutcome {
  jobId: string;
  model: string;
  durationMs: number;
  createdCount: number;
  questions: GeneratedQuestion[];
}

/**
 * Generates and persists questions through Gentle Shell.
 *
 * The job row is written before the model runs, so every attempt is auditable,
 * including failures. Nothing reaches the question bank unless the model output
 * satisfies the schema.
 */
export async function generateQuestions(
  request: QuestionRequest,
  options: { model?: string; timeoutMs?: number } = {},
): Promise<GenerationOutcome> {
  const model = options.model ?? process.env.AI_MODEL ?? DEFAULT_MODEL;
  const prompt = buildQuestionPrompt(request);
  const job = await createJob({ request, prompt, model });

  await markRunning(job.id);

  try {
    const response = await runGentleShell({
      prompt,
      system: buildSystemPrompt(),
      model,
      timeoutMs: options.timeoutMs,
    });

    const questions = parseGeneratedBatch(response.text);
    const createdCount = await persistQuestions(questions);

    await markSucceeded({
      id: job.id,
      model: response.model,
      output: questions,
      createdCount,
    });

    return {
      jobId: job.id,
      model: response.model,
      durationMs: response.durationMs,
      createdCount,
      questions,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await markFailed(job.id, message).catch(() => undefined);
    throw error;
  }
}
