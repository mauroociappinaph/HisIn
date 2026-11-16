import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="text-center py-12">
        <h1 className="text-4xl font-bold mb-4">HisIn</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Inglés técnico para el mundo healtech y emprendedor. Reforzá o aprendé el inglés que usan
          CEOs y CTOs: negocios, contratos, vocabulario médico-tecnológico y comunicación profesional.
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <Link
            href="/test"
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
          >
            Hacer test de nivel
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 border border-indigo-600 text-indigo-600 rounded-lg font-medium hover:bg-indigo-50"
          >
            Ir al dashboard
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-6">
        {[
          { title: "Vocabulario healtech", desc: "Términos médicos, regulatorios y tecnológicos." },
          { title: "Business English", desc: "Emails, reuniones, pitches y negociación." },
          { title: "Contratos", desc: "Vocabulario legal y cláusulas comunes." },
          { title: "Reading", desc: "Artículos y documentación técnica." },
          { title: "Listening", desc: "Audios y transcripciones de reuniones." },
          { title: "Gramática", desc: "Estructuras para comunicación profesional." },
        ].map((c) => (
          <div key={c.title} className="p-6 bg-white rounded-xl border shadow-sm">
            <h3 className="font-semibold mb-2">{c.title}</h3>
            <p className="text-sm text-slate-600">{c.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
