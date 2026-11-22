import type { TopicDTO } from "./repository";

/**
 * The syllabus reads as modules with submodules.
 *
 * A flat list of nine topics with codes is a table of contents; a module groups
 * the submodules that teach one structure, in order, so a learner can see "this
 * belongs with that" without reading titles.
 */
export interface SyllabusUnit {
  unit: string;
  order: number;
  topics: TopicDTO[];
}

export function groupByUnit(topics: readonly TopicDTO[]): SyllabusUnit[] {
  const units = new Map<string, SyllabusUnit>();

  for (const topic of topics) {
    const unit = topic.unit ?? "Otros temas";
    // unitOrder 0 is the database default, which means "no module": it goes last.
    const order = topic.unitOrder > 0 ? topic.unitOrder : Number.MAX_SAFE_INTEGER;
    const existing = units.get(unit);
    if (existing) {
      existing.topics.push(topic);
      existing.order = Math.min(existing.order, order);
      continue;
    }
    units.set(unit, { unit, order, topics: [topic] });
  }

  return [...units.values()]
    .map((entry) => ({
      ...entry,
      topics: [...entry.topics].sort((a, b) => a.order - b.order),
    }))
    .sort((a, b) => a.order - b.order || a.unit.localeCompare(b.unit));
}

/** A topic's display label: the owner's code when present, the position otherwise. */
export function topicLabel(topic: Pick<TopicDTO, "code" | "order">): string {
  return topic.code ?? String(topic.order);
}
