import { useMemo, useState } from 'react'
import AppButton from '../components/ui/AppButton'
import FormField from '../components/ui/FormField'
import SectionCard from '../components/ui/SectionCard'
import ConversionCard from '../components/conversion/ConversionCard'
import { getTestsForSelection } from '../data/tests'
import { getResultadoByBody } from '../services/calculator/getResultadoByBody'
import { formatMarkDisplay, formatNormalizedMarkByTest } from '../utils/formatters'
import { validateMark } from '../utils/validators'
import { cuerpos, sexos } from '../utils/constants'

// NOTA (alias pendiente): la publicación en el ranking es anónima con la
// infraestructura actual (publicMarks sin UID ni alias). Si se añade alias
// opcional, hay que ampliar las claves permitidas en firestore.rules y el
// formulario de guardado; el simulacroId ya viaja en cada marca privada.

const inputClass =
  'w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-800 outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60'

function getPlaceholder(test) {
  if (!test) return 'Selecciona cuerpo y sexo primero'
  if (test.tipoEntrada === 'time') {
    return test.formatoTiempo === 'minutesSeconds' ? 'Ejemplo: 3:25' : 'Ejemplo: 70'
  }
  if (test.tipoEntrada === 'distance') return 'Ejemplo: 2.35'
  if (test.tipoEntrada === 'suspensionSeconds') return 'Ejemplo: 42.5'
  if (test.tipoEntrada === 'repetitions') return 'Ejemplo: 14'
  return 'Introduce tu marca'
}

function lostPoints(calc) {
  if (!calc.ok) return null
  if (calc.tipo === 'puntos' && typeof calc.nota === 'number') return Math.max(0, 10 - calc.nota)
  if (calc.tipo === 'aptoNoApto') return calc.esApto ? 0 : 10
  return null
}

function SimulacroPage({ profile, user, savedMarks = [], onSaveSimulacro, onGoProfile }) {
  const [cuerpoId, setCuerpoId] = useState(profile?.cuerpoObjetivo ?? '')
  const [sexo, setSexo] = useState(profile?.sexo ?? '')
  const [edad, setEdad] = useState(profile?.edad ?? '')
  const [marcas, setMarcas] = useState({})
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [publish, setPublish] = useState(true)

  const pruebas = useMemo(() => getTestsForSelection(cuerpoId, sexo), [cuerpoId, sexo])
  const requiereEdad = useMemo(() => pruebas.some((test) => test.pideEdad), [pruebas])

  const history = useMemo(() => {
    const groups = {}
    for (const mark of savedMarks) {
      if (!mark.simulacroId) continue
      if (!groups[mark.simulacroId]) groups[mark.simulacroId] = { id: mark.simulacroId, fecha: mark.simulacroFecha ?? mark.fecha, marks: [] }
      groups[mark.simulacroId].marks.push(mark)
    }
    const list = Object.values(groups).map((group) => {
      const notas = group.marks.filter((item) => item.tipoResultado === 'puntos' && typeof item.nota === 'number')
      const aptos = group.marks.filter((item) => item.tipoResultado === 'aptoNoApto')
      let total = null
      if (notas.length === group.marks.length && notas.length > 0) {
        total = { tipo: 'puntos', nota: notas.reduce((sum, item) => sum + item.nota, 0) / notas.length }
      } else if (aptos.length === group.marks.length && aptos.length > 0) {
        total = { tipo: 'aptoNoApto', esApto: aptos.every((item) => item.esApto) }
      }
      return { ...group, total }
    })
    list.sort((a, b) => String(b.fecha ?? '').localeCompare(String(a.fecha ?? '')))
    return list.slice(0, 5)
  }, [savedMarks])

  const resetResult = () => {
    setResult(null)
    setError('')
    setSaveMessage('')
  }

  const onCalculate = (event) => {
    event.preventDefault()
    if (!cuerpoId) {
      setError('Selecciona un cuerpo.')
      setResult(null)
      return
    }
    if (!sexo) {
      setError('Selecciona el sexo.')
      setResult(null)
      return
    }
    if (requiereEdad) {
      const age = Number(edad)
      if (!Number.isInteger(age) || age < 16 || age > 65) {
        setError('Indica una edad válida (16-65).')
        setResult(null)
        return
      }
    }

    const cuerpoNombre = cuerpos.find((cuerpo) => cuerpo.id === cuerpoId)?.nombre ?? cuerpoId
    const perTest = []
    for (const test of pruebas) {
      const raw = String(marcas[test.id] ?? '').trim()
      if (!raw) {
        setError(`Introduce la marca de ${test.nombre}.`)
        setResult(null)
        return
      }
      const normalized = validateMark(raw, test)
      if (!normalized.ok) {
        setError(`${test.nombre}: ${normalized.error}`)
        setResult(null)
        return
      }
      const calc = getResultadoByBody({ cuerpoId, sexo, pruebaId: test.id, mark: normalized.value, edad: requiereEdad ? Number(edad) : undefined })
      if (!calc.ok) {
        setError(`${test.nombre}: ${calc.error}`)
        setResult(null)
        return
      }
      perTest.push({
        test,
        raw,
        mark: normalized.value,
        calc,
        lost: lostPoints(calc),
      })
    }

    let total = null
    if (perTest.every((item) => item.calc.tipo === 'puntos')) {
      total = { tipo: 'puntos', nota: perTest.reduce((sum, item) => sum + item.calc.nota, 0) / perTest.length }
    } else if (perTest.every((item) => item.calc.tipo === 'aptoNoApto')) {
      total = { tipo: 'aptoNoApto', esApto: perTest.every((item) => item.calc.esApto) }
    }

    const ranked = [...perTest].sort((a, b) => (b.lost ?? -1) - (a.lost ?? -1))
    setError('')
    setSaveMessage('')
    setResult({
      cuerpoId,
      cuerpoNombre,
      sexo,
      edad: requiereEdad ? Number(edad) : undefined,
      perTest,
      total,
      limitante: ranked[0] ?? null,
      fuerte: ranked[ranked.length - 1] ?? null,
    })
  }

  const onSave = async () => {
    if (!result) return
    try {
      await onSaveSimulacro({
        cuerpoId: result.cuerpoId,
        cuerpoNombre: result.cuerpoNombre,
        sexo: result.sexo,
        publish,
        marks: result.perTest.map((item) => ({
          cuerpoId: result.cuerpoId,
          cuerpoNombre: result.cuerpoNombre,
          sexo: result.sexo,
          pruebaId: item.test.id,
          pruebaNombre: item.test.nombre,
          tipoResultado: item.calc.tipo,
          nota: item.calc.tipo === 'puntos' ? item.calc.nota : null,
          esApto: item.calc.esApto,
          marcaNormalizada: item.mark,
          marcaMostrada: formatMarkDisplay(item.raw, item.mark, item.test),
        })),
      })
      setSaveMessage('Simulacro guardado en tu perfil correctamente.')
    } catch {
      setSaveMessage('No se pudo guardar el simulacro. Revisa Firebase e inténtalo de nuevo.')
    }
  }

  return (
    <div className="space-y-4">
      <SectionCard title="Simulacro de físicas" subtitle="Todas tus pruebas a la vez, como el día del examen">
        <form className="space-y-4" onSubmit={onCalculate}>
          <FormField label="1. Oposición">
            <select className={inputClass} value={cuerpoId} onChange={(e) => { setCuerpoId(e.target.value); setMarcas({}); resetResult() }}>
              <option value="">Selecciona un cuerpo</option>
              {cuerpos.map((cuerpo) => (
                <option key={cuerpo.id} value={cuerpo.id}>{cuerpo.nombre}</option>
              ))}
            </select>
          </FormField>

          <FormField label="2. Sexo">
            <select className={inputClass} value={sexo} disabled={!cuerpoId} onChange={(e) => { setSexo(e.target.value); setMarcas({}); resetResult() }}>
              <option value="">Selecciona sexo</option>
              {sexos.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </FormField>

          {requiereEdad ? (
            <FormField label="3. Edad">
              <input className={inputClass} type="number" min="16" max="65" value={edad} placeholder="Ejemplo: 28" onChange={(e) => { setEdad(e.target.value); resetResult() }} />
            </FormField>
          ) : null}

          {pruebas.map((test, index) => (
            <FormField key={test.id} label={`${requiereEdad ? 4 + index : 3 + index}. ${test.nombre}`}>
              <input
                className={inputClass}
                type="text"
                value={marcas[test.id] ?? ''}
                placeholder={getPlaceholder(test)}
                disabled={!cuerpoId || !sexo}
                onChange={(e) => { setMarcas((prev) => ({ ...prev, [test.id]: e.target.value })); resetResult() }}
              />
            </FormField>
          ))}

          {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p> : null}
          {saveMessage ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{saveMessage}</p> : null}

          <div className="grid grid-cols-2 gap-3">
            <AppButton type="submit">Calcular simulacro</AppButton>
            <AppButton type="button" variant="secondary" onClick={() => { setMarcas({}); resetResult() }}>
              Limpiar
            </AppButton>
          </div>
        </form>
      </SectionCard>

      {result ? (
        <SectionCard title="Resultado del simulacro" subtitle={`${result.cuerpoNombre} · ${result.sexo}`}>
          <div className="space-y-2 text-sm text-slate-700">
            {result.perTest.map((item) => (
              <p key={item.test.id}>
                <strong>{item.test.nombre}:</strong> {formatNormalizedMarkByTest(item.mark, item.test)} ·{' '}
                {item.calc.tipo === 'puntos' ? `${item.calc.nota.toFixed(2)} puntos` : item.calc.esApto ? 'Apto' : 'No apto'}
              </p>
            ))}
          </div>
          {result.total ? (
            <p className="mt-4 rounded-2xl bg-emerald-100 px-4 py-3 text-center text-lg font-extrabold text-emerald-800">
              {result.total.tipo === 'puntos' ? `Nota total: ${result.total.nota.toFixed(2)} puntos` : result.total.esApto ? 'Apto global' : 'No apto global'}
            </p>
          ) : null}
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            {result.fuerte ? <p><strong>Prueba más fuerte:</strong> {result.fuerte.test.nombre}</p> : null}
            {result.limitante ? <p><strong>Prueba limitante:</strong> {result.limitante.test.nombre}</p> : null}
          </div>

          {user?.isAnonymous ? (
            <div className="mt-4">
              <ConversionCard
                user={user}
                title="¿Quieres guardar tu simulacro?"
                description="Crea tu perfil gratuito para guardar el histórico y comparar simulacros."
                primaryLabel="Crear mi plan gratis"
                registeredLabel="Guardar simulacro"
                onPrimary={() => onGoProfile({ cuerpoId: result.cuerpoId, sexo: result.sexo })}
              />
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
                Publicar marcas en el ranking anónimo
              </label>
              <AppButton type="button" onClick={onSave}>Guardar simulacro</AppButton>
            </div>
          )}
        </SectionCard>
      ) : null}

      <SectionCard title="Historial de simulacros" subtitle="Compara con tus intentos anteriores">
        {history.length === 0 ? (
          <p className="text-sm text-slate-500">Todavía no has guardado ningún simulacro completo.</p>
        ) : (
          <div className="space-y-2">
            {history.map((group, index) => {
              const previous = history[index + 1] ?? null
              const delta = group.total?.tipo === 'puntos' && previous?.total?.tipo === 'puntos'
                ? group.total.nota - previous.total.nota
                : null
              return (
                <article key={group.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <p>
                    <strong>{group.marks[0]?.cuerpoNombre ?? ''}</strong> · {group.marks.length} pruebas ·{' '}
                    {new Date(group.fecha).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </p>
                  <p>
                    {group.total?.tipo === 'puntos'
                      ? `Nota total: ${group.total.nota.toFixed(2)} puntos`
                      : group.total?.tipo === 'aptoNoApto'
                        ? (group.total.esApto ? 'Apto global' : 'No apto global')
                        : 'Sin nota total'}
                    {delta !== null ? ` (${delta >= 0 ? '+' : ''}${delta.toFixed(2)} vs anterior)` : ''}
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

export default SimulacroPage
