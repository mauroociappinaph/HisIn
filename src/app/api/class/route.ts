import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getLocalUser } from "@/modules/identity/service";
import { ClassroomRepository } from "@/modules/classroom/repository";
import { CLASS_MINUTES, DISCIPLINES, EDUCATION_LEVELS, SEQUENCES } from "@/modules/classroom/design";

const designSchema = z.object({
  discipline: z.enum(DISCIPLINES),
  educationLevel: z.enum(EDUCATION_LEVELS),
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
  const design = await repository.saveDesign(user.id, parsed.data);
  return NextResponse.json({ design });
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
