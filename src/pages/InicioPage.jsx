import SectionCard from '../components/ui/SectionCard'
import { getTestById } from '../data/tests'
import { formatNormalizedMarkByTest } from '../utils/formatters'

function InicioPage({ publicRankings = [] }) {
  return (
    <div className="space-y-4">
      <SectionCard
        title="Bienvenido"
        subtitle="Calculadora de pruebas físicas para oposiciones policiales"
      >
        <p className="text-sm leading-relaxed text-slate-700">
          Esta versión separa pruebas y baremos por cuerpo para evitar mezclas y facilitar futuras
          actualizaciones.
        </p>
      </SectionCard>

      <SectionCard
        title="Ranking anónimo"
        subtitle="Medias globales por prueba con todas las marcas guardadas"
      >
        {publicRankings.length === 0 ? (
          <p className="text-sm text-slate-500">
            Todavía no hay suficientes registros públicos. Guarda marcas para empezar a ver
            tendencias.
          </p>
        ) : (
          <div className="space-y-2">
            {publicRankings.map((item) => {
              const testConfig = getTestById(item.testId)

              return (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                >
                  <p>
                    <strong>{item.testName}</strong>
                    {item.sexo ? ` · ${item.sexo}` : ''}
                  </p>
                  <p>
                    Media global: {formatNormalizedMarkByTest(item.avgMark, testConfig)} · Muestras:{' '}
                    {item.totalMarks}
                  </p>
                </article>
              )
            })}
          </div>
        )}
      </SectionCard>
    </div>
  )
}

export default InicioPage
