import { CEFR_LEVELS, type CefrLevel } from "@/shared/types";

/**
 * Editing an entry you wrote yourself.
 *
 * The engine mislabels things sometimes (it tagged "be interested in" as
 * `persuade` before `express` existed), and the learner's own note can be wrong
 * too. Deleting and re-adding is not a fix, so a bounded patch is: only the
 * fields that can be corrected, never the identity of the row.
 */
export const FUNCTIONS = ["hedge", "soften", "persuade", "report", "compare", "express"] as const;
export const REGISTERS = ["neutral", "informal", "formal"] as const;

export interface EntryUpdate {
  definition?: string;
  example?: string;
  notes?: string | null;
  function?: (typeof FUNCTIONS)[number] | null;
  register?: (typeof REGISTERS)[number] | null;
  separable?: boolean;
  particle?: string | null;
  term?: string;
}

export type UpdateValidation =
  | { ok: true; update: EntryUpdate }
  | { ok: false; errors: string[] };

const ALLOWED = ["definition", "example", "notes", "function", "register", "separable", "particle", "term"] as const;

export function validateUpdate(input: unknown): UpdateValidation {
  if (!input || typeof input !== "object") {
    return { ok: false, errors: ["el cuerpo del pedido está vacío"] };
  }

  const body = input as Record<string, unknown>;
  const update: EntryUpdate = {};
  const errors: string[] = [];

  for (const key of ALLOWED) {
    if (!(key in body)) continue;
    const value = body[key];

    switch (key) {
      case "definition":
      case "example": {
        if (typeof value !== "string" || value.trim().length < 10 || value.trim().length > 400) {
          errors.push(`"${key}" debe tener entre 10 y 400 caracteres`);
          break;
        }
        update[key] = value.trim();
        break;
      }
      case "notes": {
        if (value === null) {
          update.notes = null;
          break;
        }
        if (typeof value !== "string" || value.trim().length > 400) {
          errors.push('"notes" no puede superar los 400 caracteres');
          break;
        }
        update.notes = value.trim();
        break;
      }
      case "function": {
        if (value === null) {
          update.function = null;
          break;
        }
        if (typeof value !== "string" || !(FUNCTIONS as readonly string[]).includes(value)) {
          errors.push(`"function" debe ser uno de: ${FUNCTIONS.join(", ")}`);
          break;
        }
        update.function = value as EntryUpdate["function"];
        break;
      }
      case "register": {
        if (value === null) {
          update.register = null;
          break;
        }
        if (typeof value !== "string" || !(REGISTERS as readonly string[]).includes(value)) {
          errors.push(`"register" debe ser uno de: ${REGISTERS.join(", ")}`);
          break;
        }
        update.register = value as EntryUpdate["register"];
        break;
      }
      case "separable": {
        if (typeof value !== "boolean") {
          errors.push('"separable" debe ser true o false');
          break;
        }
        update.separable = value;
        break;
      }
      case "particle": {
        if (value === null) {
          update.particle = null;
          break;
        }
        if (typeof value !== "string" || value.trim().length === 0 || value.trim().length > 20) {
          errors.push('"particle" debe ser una palabra de hasta 20 caracteres');
          break;
        }
        update.particle = value.trim().toLowerCase();
        break;
      }
      case "term": {
        if (typeof value !== "string" || value.trim().length < 2 || value.trim().length > 40) {
          errors.push('"term" debe tener entre 2 y 40 caracteres');
          break;
        }
        update.term = value.trim();
        break;
      }
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  if (Object.keys(update).length === 0) {
    return { ok: false, errors: ["no hay ningún campo para corregir"] };
  }
  return { ok: true, update };
}

/** Kept for the level field, which the patch does not allow: identity stays. */
export function isCefrLevel(value: string): value is CefrLevel {
  return (CEFR_LEVELS as readonly string[]).includes(value);
}
