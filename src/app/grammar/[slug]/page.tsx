import Link from "next/link";
import { notFound } from "next/navigation";
import { LevelBadge, SpeakButton } from "@/components/vocab-ui";
import { AXIS_LABELS, GRAMMAR_TOPICS, findTopic } from "@/modules/grammar/content";
import { MarkSeen } from "./mark-seen";

export function generateStaticParams() {
  return GRAMMAR_TOPICS.map((topic) => ({ slug: topic.slug }));
}

/**
 * One topic per page, with the shape a university session expects: where it is
 * used, how it is built, examples in the learner's domain, the Spanish-speaker
 * error, and a way to practise it.
 */
export default async function GrammarTopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const topic = findTopic(slug);
  if (!topic) notFound();

  return (
    <div className="space-y-6">
      <nav className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
        <Link href="/grammar" className="hover:text-indigo-600">
          Gramática
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-slate-700">{topic.title}</span>
      </nav>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
            {AXIS_LABELS[topic.axis]}
          </span>
          <LevelBadge level={topic.level} />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">{topic.title}</h1>
        <p className="text-slate-600 max-w-2xl">{topic.summary}</p>
      </header>

      <section className="rounded-lg bg-white border border-slate-200 p-5 space-y-2">
        <h2 className="text-xs uppercase tracking-widest text-slate-500">La fórmula</h2>
        <p className="font-mono text-sm md:text-base text-slate-800 bg-slate-50 rounded-sm px-3 py-2">
          {topic.form}
        </p>
      </section>

      <section className="rounded-lg bg-white border border-slate-200 p-5 space-y-3">
        <h2 className="font-semibold text-slate-800">¿Dónde se usa?</h2>
        <ul className="space-y-2">
          {topic.whenToUse.map((use) => (
            <li key={use} className="flex gap-2 text-sm text-slate-700">
              <span aria-hidden="true" className="text-indigo-600">
                →
              </span>
              <span>{use}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg bg-white border border-slate-200 p-5 space-y-3">
        <h2 className="font-semibold text-slate-800">Ejemplos</h2>
        <ul className="space-y-3">
          {topic.examples.map((example) => (
            <li key={example.en} className="flex items-start justify-between gap-3">
              <div>
                <p className="text-slate-800">{example.en}</p>
                <p className="text-xs text-slate-500 italic">{example.es}</p>
              </div>
              <SpeakButton text={example.en} label={`Escuchar: ${example.en}`} />
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg bg-white border border-slate-200 p-5 space-y-3">
        <h2 className="font-semibold text-slate-800">El error del hispanohablante</h2>
        <ul className="space-y-3">
          {topic.errors.map((error) => (
            <li key={error.wrong} className="rounded-sm border border-slate-200 overflow-hidden">
              <p className="px-3 py-2 text-sm bg-rose-50 text-rose-800">
                <span aria-hidden="true">✗ </span>
                {error.wrong}
              </p>
              <p className="px-3 py-2 text-sm bg-emerald-50 text-emerald-800">
                <span aria-hidden="true">✓ </span>
                {error.right}
              </p>
              <p className="px-3 py-2 text-xs text-slate-600">{error.why}</p>
            </li>
          ))}
        </ul>
      </section>

      {topic.relatedPatterns.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-xs uppercase tracking-widest text-slate-500">Patrones relacionados</h2>
          <div className="flex flex-wrap gap-2">
            {topic.relatedPatterns.map((frame) => (
              <Link
                key={frame}
                href="/patterns"
                className="px-3 py-1.5 rounded-sm bg-sky-50 text-sky-700 text-xs font-semibold hover:bg-sky-100"
              >
                {frame}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <MarkSeen topicSlug={topic.slug} />
        <Link
          href={`/class?tema=${encodeURIComponent(topic.title)}`}
          className="px-4 py-2 rounded-sm border border-slate-300 text-sm font-medium hover:border-indigo-300"
        >
          Diseñar una clase con este tema
        </Link>
        <Link
          href="/review/vocab"
          className="px-4 py-2 rounded-sm border border-slate-300 text-sm font-medium hover:border-indigo-300"
        >
          Practicar
        </Link>
      </div>
    </div>
  );
}
