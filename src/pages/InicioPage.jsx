import SectionCard from '../components/ui/SectionCard'
import AdSlot from '../components/ads/AdSlot'
import { getTestById } from '../data/tests'
import { formatNormalizedMarkByTest } from '../utils/formatters'

function InicioPage({ publicRankings = [] }) {
  return (
    <div className="space-y-4">
      <AdSlot slot={import.meta.env.VITE_ADSENSE_SLOT_TOP || '1111111111'} />

      <SectionCard
        title="Bienvenido"
        subtitle="Calculadora de pruebas físicas para oposiciones policiales"
      >
        <p className="text-sm leading-relaxed text-slate-700">
          Esta versión separa pruebas y baremos por cuerpo para evitar mezclas y facilitar futuras
          actualizaciones.
        </p>
      </SectionCard>

      <SectionCard title="Blog deportivo" subtitle="Rendimiento, recuperación y preparación inteligente">
        <article className="space-y-3 text-sm leading-relaxed text-slate-700">
          <p>
            Preparar una oposición física no consiste solo en entrenar más. La mejora real llega cuando combinas control de cargas, descanso, técnica, nutrición y seguimiento de marcas. Esta app centraliza esos datos para que puedas tomar mejores decisiones semana a semana.
          </p>
          <p>
            Usa el calendario para diferenciar sesiones planificadas y reales, registra sensaciones de esfuerzo y revisa si tu volumen semanal encaja con la fecha prevista de examen. Las recomendaciones no sustituyen a un entrenador sanitario o médico, pero ayudan a ordenar la preparación.
          </p>
          <p className="rounded-2xl bg-brand-50 p-3 font-semibold text-brand-900">
            Consejo: registra al menos una marca de referencia cada 10-14 días. Evita probarte al máximo todos los días para no acumular fatiga innecesaria.
          </p>
        </article>
      </SectionCard>

      <AdSlot slot={import.meta.env.VITE_ADSENSE_SLOT_CONTENT || '2222222222'} />

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
