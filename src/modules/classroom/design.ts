/**
 * The teaching context every plan and every lesson in the app depends on.
 *
 * These four parameters are not decoration: they decide how much time each phase
 * of a session gets, which activity fits the discipline, and whether the session
 * is a one-off or one week of a sequence. They are validated in one place so no
 * screen can invent its own defaults.
 */
export const DISCIPLINES = ["negocios", "salud", "derecho", "ingenieria", "lenguas"] as const;
export type Discipline = (typeof DISCIPLINES)[number];

export const EDUCATION_LEVELS = [
  "grado_inicial",
  "grado_avanzado",
  "posgrado",
  "formacion_profesional",
] as const;
export type EducationLevel = (typeof EDUCATION_LEVELS)[number];

export const CLASS_MINUTES = [45, 60, 90, 120] as const;
export type ClassMinutes = (typeof CLASS_MINUTES)[number];

export const SEQUENCES = ["unica", "semanal"] as const;
export type Sequence = (typeof SEQUENCES)[number];

export interface ClassDesign {
  discipline: Discipline;
  educationLevel: EducationLevel;
  minutes: ClassMinutes;
  sequence: Sequence;
}

export type Phase =
  | "apertura"
  | "mini-input"
  | "ciclo-activo"
  | "aplicacion"
  | "cierre";

export interface Block {
  phase: Phase;
  minutes: number;
  title: string;
  detail: string;
  /** What the teacher collects as evidence of learning in this block. */
  evidence: string;
}

export interface LessonFlow {
  minutes: ClassMinutes;
  blocks: Block[];
  /** Work the learner does before the session (flipped / just-in-time). */
  prework: string | null;
  /** What carries the learning into the following week. */
  transfer: string;
}

/**
 * Proportion of the session each phase gets, taken from the instructional-design
 * template: a short opener, a bounded explanation, the active cycle, the
 * application, and a closing that is scheduled instead of hoped for.
 */
const SHARES: Record<Phase, number> = {
  apertura: 0.07,
  "mini-input": 0.18,
  "ciclo-activo": 0.27,
  aplicacion: 0.37,
  cierre: 0.11,
};

const PHASE_COPY: Record<Phase, { title: string; detail: string; evidence: string }> = {
  apertura: {
    title: "Apertura con recuperación",
    detail: "Dos preguntas de la clase anterior, individuales y sin apuntes, para traer el contenido a la memoria de trabajo.",
    evidence: "Respuestas escritas: el error dominante define el resto de la sesión.",
  },
  "mini-input": {
    title: "Explicación acotada",
    detail: "Un solo argumento central con un ejemplo resuelto. Nada que el aprendiz pueda descubrir solo.",
    evidence: "—",
  },
  "ciclo-activo": {
    title: "Ciclo activo",
    detail: "Pregunta conceptual, voto individual, discusión en parejas y segundo voto: se aprende del error visible.",
    evidence: "Distribución de respuestas antes y después de discutir.",
  },
  aplicacion: {
    title: "Aplicación en contexto",
    detail: "Tarea auténtica en tríos con un producto concreto y una decisión que defender.",
    evidence: "Producto del trío: decisión + razones.",
  },
  cierre: {
    title: "Cierre y ticket de salida",
    detail: "Síntesis hecha por el aprendiz y dos preguntas de salida que se leen el mismo día.",
    evidence: "Ticket de salida clasificado en logrado / parcial / no logrado.",
  },
};

/** The application task changes with the discipline, or the class is generic. */
const APPLICATION: Record<Discipline, string> = {
  negocios: "un board update de 5 líneas para una ronda que se atrasó",
  salud: "una nota clínica breve que otro profesional pueda leer sin preguntar",
  derecho: "una cláusula de responsabilidad con su justificación en dos líneas",
  ingenieria: "un incident report con causa, impacto y acción siguiente",
  lenguas: "un mensaje de trabajo real que use las estructuras de la sesión",
};

const PREWORK: Record<Sequence, string | null> = {
  unica: null,
  semanal: "Antes de la clase: un texto de 8 minutos y dos preguntas de 3 líneas cada una, para arrancar desde lo que ya intentaron.",
};

const TRANSFER: Record<Sequence, string> = {
  unica:
    "Cerrar con una tarea auténtica evaluada con la misma rúbrica de la clase, entregada dentro de la semana.",
  semanal:
    "Reintroducir el foco en la sesión 2 y 4 de la secuencia, y evaluarlo en la tarea de la semana con la misma rúbrica.",
};

export interface ClassDesignValidation {
  ok: boolean;
  design: ClassDesign | null;
  errors: string[];
}

/** One gate for every screen: no plan exists without a complete, valid context. */
export function validateClassDesign(input: Partial<ClassDesign>): ClassDesignValidation {
  const errors: string[] = [];

  if (!input.discipline || !DISCIPLINES.includes(input.discipline)) {
    errors.push(`la disciplina debe ser una de: ${DISCIPLINES.join(", ")}`);
  }
  if (!input.educationLevel || !EDUCATION_LEVELS.includes(input.educationLevel)) {
    errors.push(`el nivel educativo debe ser uno de: ${EDUCATION_LEVELS.join(", ")}`);
  }
  if (!input.minutes || !CLASS_MINUTES.includes(input.minutes)) {
    errors.push(`la duración debe ser una de: ${CLASS_MINUTES.join(", ")} minutos`);
  }
  if (!input.sequence || !SEQUENCES.includes(input.sequence)) {
    errors.push(`la secuencia debe ser "unica" o "semanal"`);
  }

  if (errors.length > 0) return { ok: false, design: null, errors };
  return { ok: true, design: input as ClassDesign, errors: [] };
}

/**
 * Distributes the minutes so the total is exact.
 *
 * Rounding is applied to every phase but the last one, and the closing absorbs
 * the remainder: a plan that says 90 minutes and adds up to 88 is a plan nobody
 * trusts.
 */
function distribute(minutes: number): Record<Phase, number> {
  const phases = Object.keys(SHARES) as Phase[];
  const out = {} as Record<Phase, number>;
  let assigned = 0;

  phases.forEach((phase, index) => {
    if (index === phases.length - 1) {
      out[phase] = minutes - assigned;
      return;
    }
    const value = Math.max(1, Math.round(minutes * SHARES[phase]));
    out[phase] = value;
    assigned += value;
  });

  return out;
}

export function buildLessonFlow(design: ClassDesign): LessonFlow {
  const minutes = distribute(design.minutes);
  const blocks = (Object.keys(PHASE_COPY) as Phase[]).map<Block>((phase) => ({
    phase,
    minutes: minutes[phase],
    ...PHASE_COPY[phase],
    detail:
      phase === "aplicacion"
        ? `${PHASE_COPY.aplicacion.detail} En ${design.discipline}: ${APPLICATION[design.discipline]}.`
        : PHASE_COPY[phase].detail,
  }));

  return {
    minutes: design.minutes,
    blocks,
    prework: PREWORK[design.sequence],
    transfer: TRANSFER[design.sequence],
  };
}

/** Short label used wherever a design is shown next to content. */
export function describeDesign(design: ClassDesign): string {
  const level = {
    grado_inicial: "grado inicial",
    grado_avanzado: "grado avanzado",
    posgrado: "posgrado",
    formacion_profesional: "formación profesional",
  }[design.educationLevel];
  return `${design.discipline} · ${level} · ${design.minutes} min · ${
    design.sequence === "semanal" ? "secuencia semanal" : "clase única"
  }`;
}
