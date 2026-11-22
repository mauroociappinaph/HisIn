import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getLocalUser } from "@/modules/identity/service";
import { ClassroomRepository } from "@/modules/classroom/repository";
import { CLASS_MINUTES, DISCIPLINES, EDUCATION_LEVELS, SEQUENCES } from "@/modules/classroom/design";

const designSchema = z.object({
  discipline: z.enum(DISCIPLINES),
  educationLevel: z.union([z.enum(EDUCATION_LEVELS), z.literal("mixto")]),
  educationMix: z
    .object({
      grado_inicial: z.number().int().min(0).max(100).optional(),
      grado_avanzado: z.number().int().min(0).max(100).optional(),
      posgrado: z.number().int().min(0).max(100).optional(),
      formacion_profesional: z.number().int().min(0).max(100).optional(),
    })
    .optional(),
  minutes: z.union([z.literal(45), z.literal(60), z.literal(90), z.literal(120)]),
  sequence: z.enum(SEQUENCES),
});

const planSchema = z.object({ topic: z.string().trim().min(3).max(120) });

export async function GET() {
  const user = await getLocalUser();
  const repository = new ClassroomRepository();
  const [design, plans] = await Promise.all([
    repository.getDesign(user.id),
    repository.listPlans(user.id),
  ]);
  return NextResponse.json({ design, plans, minutesOptions: CLASS_MINUTES });
}

/** Saves the teaching context that every generated plan depends on. */
export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = designSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "contexto de clase inválido", issues: parsed.error.issues.map((issue) => issue.message) },
      { status: 400 },
    );
  }

  const user = await getLocalUser();
  const repository = new ClassroomRepository();
  try {
    const design = await repository.saveDesign(user.id, parsed.data);
    return NextResponse.json({ design });
  } catch (error) {
    // A mixed cohort that does not add up to 100% is a client error, not a crash.
    const message = error instanceof Error ? error.message : "contexto de clase inválido";
    return NextResponse.json({ error: "contexto de clase inválido", issues: [message] }, { status: 400 });
  }
}

/** Generates and stores one session plan for the saved context. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = planSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "escribí el tema de la clase" }, { status: 400 });
  }

  const user = await getLocalUser();
  const repository = new ClassroomRepository();
  const plan = await repository.createPlan(user.id, parsed.data.topic);
  return NextResponse.json({ plan }, { status: 201 });
}
