import { formatResultado } from '../../utils/formatters'

function ResultCard({ result }) {
  if (!result) return null

  const statusClass = result.tipo === 'aptoNoApto' && !result.esApto
    ? 'bg-rose-100 text-rose-700'
    : 'bg-emerald-100 text-emerald-700'

  return (
    <article className="rounded-3xl border border-brand-100 bg-brand-50 p-5">
      <h3 className="text-sm font-extrabold uppercase tracking-wide text-brand-800">Resultado</h3>
      <div className="mt-3 space-y-2 text-sm text-slate-700">
        <p><strong>Cuerpo:</strong> {result.cuerpoNombre}</p>
        <p><strong>Sexo:</strong> {result.sexo}</p>
        <p><strong>Prueba:</strong> {result.pruebaNombre}</p>
        <p><strong>Marca:</strong> {result.marcaMostrada}</p>
        {result.convocatoria ? <p><strong>Baremo:</strong> {result.convocatoria}</p> : null}
      </div>
      <div className={`mt-4 rounded-2xl px-4 py-3 text-center text-lg font-extrabold ${statusClass}`}>
        {formatResultado(result)}
      </div>
      <p className="mt-2 text-sm text-slate-700">{result.observacion}</p>
    </article>
  )
}

export default ResultCard
