import { prisma } from "@/shared/db/prisma";
import type { VocabularyDTO, CefrLevel } from "@/shared/types";
import type { EntryKind } from "./entry";

/**
 * Columns beyond the seven original ones (kind, particle, source, extraExample,
 * notes, separable, register, function) are optional in the DTO: seeded rows
 * predate them and a missing value must not read as a broken row.
 */
function toDTO(r: {
  id: string;
  term: string;
  definition: string;
  example: string;
  module: string;
  level: string;
  kind: string;
  particle: string | null;
  source: string;
  extraExample: string | null;
  notes: string | null;
  separable: boolean | null;
  register: string | null;
  function: string | null;
}): VocabularyDTO {
  return {
    id: r.id,
    term: r.term,
    definition: r.definition,
    example: r.example,
    module: r.module,
    level: r.level as CefrLevel,
    kind: r.kind as EntryKind,
    particle: r.particle ?? undefined,
    source: r.source as VocabularyDTO["source"],
    extraExample: r.extraExample ?? undefined,
    notes: r.notes ?? undefined,
    separable: r.separable ?? undefined,
    register: r.register ?? undefined,
    function: r.function ?? undefined,
  };
}

export interface CreateEntryInput {
  term: string;
  definition: string;
  example: string;
  module: string;
  level: CefrLevel;
  kind: EntryKind;
  particle?: string | null;
  separable?: boolean | null;
  register?: string | null;
  function?: string | null;
  extraExample?: string | null;
  notes?: string | null;
}

export class VocabularyRepository {
  async findByModule(module: string, level?: CefrLevel): Promise<VocabularyDTO[]> {
    const rows = await prisma.vocabulary.findMany({
      where: { module, ...(level ? { level } : {}) },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toDTO);
  }

  /** Whole bank, for the trainer's explorer and quiz pool. */
  async findAll(): Promise<VocabularyDTO[]> {
    const rows = await prisma.vocabulary.findMany({
      orderBy: [{ module: "asc" }, { level: "asc" }, { term: "asc" }],
    });
    return rows.map(toDTO);
  }

  /** One kind of entry (words, phrasal verbs or patterns), newest first. */
  async findByKind(kind: EntryKind): Promise<VocabularyDTO[]> {
    const rows = await prisma.vocabulary.findMany({
      where: { kind },
      orderBy: [{ level: "asc" }, { term: "asc" }],
    });
    return rows.map(toDTO);
  }

  async findByTermAndKind(term: string, kind: EntryKind): Promise<VocabularyDTO | null> {
    const row = await prisma.vocabulary.findFirst({
      where: { term: { equals: term, mode: "insensitive" }, kind },
    });
    return row ? toDTO(row) : null;
  }

  /**
   * Writes a learner entry and its first review row.
   *
   * Without that review row the entry would never surface in the queue: the SRS
   * reads schedules, not vocabulary. Both writes belong to the same action, so a
   * failure leaves no half-created entry.
   */
  async createUserEntry(userId: string, input: CreateEntryInput): Promise<VocabularyDTO> {
    const created = await prisma.$transaction(async (tx) => {
      const row = await tx.vocabulary.create({
        data: {
          term: input.term,
          definition: input.definition,
          example: input.example,
          module: input.module,
          level: input.level,
          kind: input.kind,
          particle: input.particle ?? null,
          separable: input.separable ?? null,
          register: input.register ?? null,
          function: input.function ?? null,
          extraExample: input.extraExample ?? null,
          notes: input.notes ?? null,
          source: "USER",
        },
      });

      await tx.vocabularyReview.create({
        data: { userId, vocabularyId: row.id, nextReview: new Date() },
      });

      return row;
    });

    return toDTO(created);
  }

  /** Applies a validated patch to a user entry and returns the fresh DTO. */
  async updateEntry(id: string, update: Partial<CreateEntryInput> & { notes?: string | null }): Promise<VocabularyDTO> {
    const row = await prisma.vocabulary.update({
      where: { id },
      data: {
        ...(update.term !== undefined ? { term: update.term } : {}),
        ...(update.definition !== undefined ? { definition: update.definition } : {}),
        ...(update.example !== undefined ? { example: update.example } : {}),
        ...(update.notes !== undefined ? { notes: update.notes } : {}),
        ...(update.particle !== undefined ? { particle: update.particle } : {}),
        ...(update.separable !== undefined ? { separable: update.separable } : {}),
        ...(update.register !== undefined ? { register: update.register } : {}),
        ...(update.function !== undefined ? { function: update.function } : {}),
        ...(update.extraExample !== undefined ? { extraExample: update.extraExample } : {}),
      },
    });
    return toDTO(row);
  }

  async findById(id: string) {
    return prisma.vocabulary.findUnique({ where: { id } });
  }

  async deleteById(id: string) {
    await prisma.vocabulary.delete({ where: { id } });
  }
}
