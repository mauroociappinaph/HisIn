/**
 * The three chips on a chunk card measure different things and nothing said so.
 * This legend is the fix: grammar, register, origin — never the same axis.
 */
export function ChipsLegend() {
  return (
    <dl className="grid gap-2 sm:grid-cols-3 text-xs text-slate-600 bg-white border border-slate-200 rounded-lg p-4">
      <div>
        <dt className="font-semibold text-slate-800">separable / insegurable</dt>
        <dd>
          Gramática: ¿el objeto va en el medio? <span className="font-mono">turn it off</span> ✅ ·{" "}
          <span className="font-mono">turn off it</span> ❌
        </dd>
      </div>
      <div>
        <dt className="font-semibold text-slate-800">neutral / informal / formal</dt>
        <dd>Registro: dónde queda bien usarlo. Un contrato no lleva lo informal.</dd>
      </div>
      <div>
        <dt className="font-semibold text-slate-800">propia</dt>
        <dd>Origen: la cargaste vos, por eso podés editarla o borrarla.</dd>
      </div>
    </dl>
  );
}
