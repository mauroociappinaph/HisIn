import Link from "next/link";
import { LevelBadge } from "@/components/vocab-ui";
import { AXIS_LABELS, topicsByAxis, type GrammarAxis } from "@/modules/grammar/content";

export const metadata = {
  title: "Gramática — HisIn",
};

const AXES: GrammarAxis[] = ["TIEMPOS", "ESTRUCTURAS", "REGLAS"];

/**
 * The grammar map. Everything is open: the levels order the content, they do not
 * gate it, because "unlock to learn" turns curiosity into a queue.
 */
export default function GrammarPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">Gramática</h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          Cada tema responde lo mismo: <strong>dónde se usa</strong>, cómo se arma, ejemplos en tu contexto y el
          error que hace un hispanohablante. Sin candados: entrá por donde te sirva hoy.
        </p>
      </header>

      {AXES.map((axis) => {
        const topics = topicsByAxis(axis);
        if (topics.length === 0) return null;
        return (
          <section key={axis} className="space-y-3">
            <h2 className="text-xs uppercase tracking-widest text-slate-500">{AXIS_LABELS[axis]}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {topics.map((topic) => (
                <Link
                  key={topic.slug}
                  href={`/grammar/${topic.slug}`}
                  className="rounded-lg bg-white border border-slate-200 p-4 space-y-2 hover:border-indigo-300 hover:shadow-sm transition"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-slate-800">{topic.title}</h3>
                    <LevelBadge level={topic.level} />
                  </div>
                  <p className="text-xs text-slate-600">{topic.summary}</p>
                  <p className="text-[11px] font-mono text-slate-500 bg-slate-50 rounded-sm px-2 py-1">
                    {topic.form}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      <p className="text-xs text-slate-400">
        ¿Querés practicarlo ahora?{" "}
        <Link href="/review/vocab" className="text-indigo-600 hover:underline">
          Repaso espaciado
        </Link>{" "}
        ·{" "}
        <Link href="/patterns" className="text-indigo-600 hover:underline">
          Patrones
        </Link>
      </p>
    </div>
  );
}
