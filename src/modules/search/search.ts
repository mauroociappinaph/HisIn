/**
 * Search across everything the course knows.
 *
 * Natural language in, ranked material out: the learner types the question the way
 * they would say it in Spanish or English, and the index answers with the lesson,
 * the word, the story or the news that covers it. No embedding model, no network
 * call: normalisation, synonyms and BM25, which is deterministic and fast enough to
 * run on every keystroke.
 */

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "of", "for", "with",
  "is", "are", "was", "were", "be", "been", "it", "its", "this", "that", "these",
  "those", "i", "you", "he", "she", "we", "they", "as", "by", "from", "so", "if",
  "not", "no", "do", "does", "did", "how", "what", "when", "where", "who", "why",
  "que", "como", "donde", "cuando", "cual", "los", "las", "el", "la", "un", "una",
  "de", "del", "en", "por", "para", "con", "se", "su", "al", "y", "o", "es", "son",
  "mi", "me", "te", "lo", "muy", "mas", "más", "sirve", "sirven", "dice", "decir",
  "significa", "significado", "usar", "usa", "uso", "forma", "entre", "esta", "este",
]);

/**
 * Domain synonyms, both directions.
 *
 * A learner searches with the words they have, not with the words the material uses:
 * "disculpa" must find "apologise", "plata" must find "funding". This is the cheapest
 * part of the system and the one that changes the results the most.
 */
const SYNONYMS: Record<string, string[]> = {
  disculpa: ["apology", "apologise", "apologize", "sorry", "regret"],
  disculpar: ["apology", "apologise", "regret"],
  perdon: ["apology", "apologise", "sorry"],
  plata: ["funding", "capital", "runway", "raise", "money", "budget"],
  dinero: ["funding", "capital", "money", "budget"],
  error: ["mistake", "blunder", "slip", "error"],
  metida: ["blunder", "mistake"],
  negativa: ["negative", "negatives", "deny", "refuse"],
  pregunta: ["question", "questions", "ask"],
  pasado: ["past", "perfect", "continuous"],
  futuro: ["future", "will", "going"],
  condicional: ["conditional", "if", "would"],
  reunion: ["meeting", "stand-up", "retrospective", "board"],
  clinica: ["clinic", "clinical", "patient", "hospital", "ward"],
  paciente: ["patient", "clinical"],
  inversor: ["investor", "funding", "pitch", "board", "raise"],
  trabajo: ["work", "employment", "office", "team", "job"],
  email: ["email", "corporate", "writing", "memo", "correspondence"],
  correo: ["email", "corporate", "correspondence"],
  entrevista: ["interview", "candidate", "hiring"],
  regla: ["rule", "structure", "grammar"],
  phrasal: ["phrasal", "particle", "verb"],
  regaño: ["blunder", "criticism", "reprimand"],
  disculpas: ["apology", "apologise", "apologize", "regret"],
  negociacion: ["negotiation", "negotiate", "bargain", "deal", "concession"],
  negociar: ["negotiation", "negotiate", "bargain"],
  clausula: ["clause", "clauses", "contract", "term"],
  clausulas: ["clause", "clauses", "contract", "term"],
  contrato: ["contract", "agreement", "clause", "term"],
  presupuesto: ["budget", "cost", "pricing", "financial"],
  precio: ["price", "pricing", "cost", "rate"],
  riesgo: ["risk", "liability", "exposure", "compliance"],
  informe: ["report", "memo", "brief", "update"],
  propuesta: ["proposal", "pitch", "offer", "deck"],
  subir: ["increase", "raise", "jack", "hike", "grow"],
  bajar: ["decrease", "reduce", "cut", "lower", "drop"],
  acuerdo: ["agreement", "consensus", "deal"],
  culpa: ["blame", "fault", "regret", "apology"],
  duda: ["doubt", "hedge", "uncertainty", "wonder"],
  cortesia: ["polite", "politeness", "courtesy", "hedge", "register"],
  formal: ["formal", "register", "corporate", "professional"],
  equipo: ["team", "crew", "squad"],
  problema: ["problem", "issue", "blocker", "trouble"],
};

/** The tokens of a query, each with its domain synonyms, as one group per token. */
export function termGroups(tokens: readonly string[]): string[][] {
  const groups: string[][] = [];
  for (const token of tokens) {
    const variants = new Set<string>([token]);
    for (const synonym of SYNONYMS[token] ?? []) variants.add(synonym);

    // A gerund or a plural still has to find its base: "shipping" -> "ship".
    if (token.length > 4 && token.endsWith("s")) {
      const singular = token.slice(0, -1);
      variants.add(singular);
      for (const synonym of SYNONYMS[singular] ?? []) variants.add(synonym);
    }
    // Spanish plurals drop "es": formales -> formal, not formale.
    if (token.length > 5 && token.endsWith("es")) {
      const stemEs = token.slice(0, -2);
      variants.add(stemEs);
      for (const synonym of SYNONYMS[stemEs] ?? []) variants.add(synonym);
    }
    if (token.length > 5 && token.endsWith("ing")) {
      let stem = token.slice(0, -3);
      // "shipping" loses ing and keeps a doubled consonant: undo the doubling.
      if (/([bdgklmnprt])\1$/.test(stem)) stem = stem.slice(0, -1);
      variants.add(stem);
      for (const synonym of SYNONYMS[stem] ?? []) variants.add(synonym);
    }

    groups.push([...variants]);
  }
  return groups;
}

export function normalise(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(text: string): string[] {
  return normalise(text)
    .split(" ")
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

/** The query tokens plus their domain synonyms, deduplicated. */
export function expand(tokens: readonly string[]): string[] {
  // One implementation, two entry points: expand is the flat view of the same
  // grouping the ranking uses, so the test and the search never disagree.
  return [...new Set(termGroups(tokens).flat())];
}

export type DocumentKind = "topic" | "term" | "word" | "story" | "news" | "mistake";

export interface SearchDocument {
  id: string;
  kind: DocumentKind;
  title: string;
  body: string;
  /** Where the result sends the learner. */
  href: string;
  /** Module name, level or type, shown next to the result. */
  meta?: string;
  level?: string;
}

export interface SearchHit {
  document: SearchDocument;
  score: number;
  /** How much of the query this document answers, 0 to 1. */
  coverage: number;
}

/** A match in the title is worth this much more than a match in the body. */
const TITLE_WEIGHT = 3.2;
/** Results below this fraction of the best score are noise, not answers. */
const RELATIVE_CUTOFF = 0.3;
/** A match found through a synonym is worth this fraction of the literal match. */
const SYNONYM_PENALTY = 0.55;

/**
 * BM25 over the collection, with a title boost.
 *
 * BM25 rather than a plain token count because it damps very long documents and
 * rarely used terms, which is exactly the difference between finding the lesson that
 * explains a rule and finding the twelve that mention the word once.
 */
export function searchDocuments(
  query: string,
  documents: readonly SearchDocument[],
  limit = 20,
  options: { minCoverage?: number } = {},
): SearchHit[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];
  const groups = termGroups(tokens);

  const indexed = documents.map((document) => ({
    document,
    titleTokens: tokenize(document.title),
    bodyTokens: tokenize(`${document.title} ${document.body}`),
  }));

  const averageLength =
    indexed.reduce((total, entry) => total + entry.bodyTokens.length, 0) / Math.max(indexed.length, 1);

  // One document frequency per variant, so a synonym is worth what it is worth in
  // this collection rather than a fixed guess.
  const documentFrequency = new Map<string, number>();
  for (const entry of indexed) {
    for (const token of new Set(entry.bodyTokens)) {
      documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
    }
  }

  const total = Math.max(indexed.length, 1);
  const k1 = 1.4;
  const b = 0.7;
  const idf = (term: string) => {
    const df = documentFrequency.get(term) ?? 0;
    return Math.log(1 + (total - df + 0.5) / (df + 0.5));
  };

  const hits: SearchHit[] = [];
  for (const entry of indexed) {
    const length = entry.bodyTokens.length || 1;
    const titleSet = new Set(entry.titleTokens);
    const frequencies = new Map<string, number>();
    for (const token of entry.bodyTokens) frequencies.set(token, (frequencies.get(token) ?? 0) + 1);

    let score = 0;
    let matchedGroups = 0;

    for (const group of groups) {
      let best = 0;
      const exact = group[0];
      for (const variant of group) {
        const frequency = frequencies.get(variant) ?? 0;
        if (frequency === 0) continue;
        const termScore =
          idf(variant) * ((frequency * (k1 + 1)) / (frequency + k1 * (1 - b + b * (length / averageLength))));
        // The title is the intent of the document: a match there is worth more.
        // A match through a synonym is worth less than the word itself, otherwise
        // "plata" is satisfied by "runway" and the query stops meaning anything.
        const weight = (titleSet.has(variant) ? TITLE_WEIGHT : 1) * (variant === exact ? 1 : SYNONYM_PENALTY);
        best = Math.max(best, termScore * weight);
      }
      if (best > 0) {
        matchedGroups += 1;
        score += best;
      }
    }

    if (matchedGroups === 0) continue;

    // Coverage is a multiplier, not a bonus: a document that answers only one word
    // of a three-word question is not a good answer, however often it says it.
    const coverage = matchedGroups / groups.length;
    const floor = options.minCoverage ?? 0.5;
    if (groups.length > 1 && coverage < floor) continue;
    score *= coverage * coverage;

    if (score > 0) hits.push({ document: entry.document, score, coverage });
  }

  hits.sort((first, second) => second.score - first.score);

  // Synonym expansion brings noise by construction, so results far below the best
  // one are dropped instead of padding the list.
  const best = hits[0]?.score ?? 0;
  return hits.filter((hit) => hit.score >= best * RELATIVE_CUTOFF).slice(0, limit);
}

/** Results grouped by kind, in the order a learner wants to read them. */
export function groupHits(hits: readonly SearchHit[]): { kind: DocumentKind; label: string; hits: SearchHit[] }[] {
  const order: { kind: DocumentKind; label: string }[] = [
    { kind: "topic", label: "Lessons" },
    { kind: "term", label: "Terms in the stories" },
    { kind: "word", label: "Your vocabulary" },
    { kind: "mistake", label: "Your mistakes" },
    { kind: "story", label: "Stories" },
    { kind: "news", label: "News" },
  ];

  return order
    .map((entry) => ({ ...entry, hits: hits.filter((hit) => hit.document.kind === entry.kind) }))
    .filter((group) => group.hits.length > 0);
}
