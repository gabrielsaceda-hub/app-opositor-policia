import { useMemo, useState } from 'react'
import ResultCard from '../components/calculator/ResultCard'
import ConversionCard from '../components/conversion/ConversionCard'
import AppButton from '../components/ui/AppButton'
import FormField from '../components/ui/FormField'
import SectionCard from '../components/ui/SectionCard'
import { getTestsForSelection } from '../data/tests'
import { getResultadoByBody } from '../services/calculator/getResultadoByBody'
import { cuerpos, sexos } from '../utils/constants'
import { formatMarkDisplay } from '../utils/formatters'
import { validateForm, validateMark } from '../utils/validators'
import { logAnalyticsEvent } from '../services/firebase/firebaseClient'

const inputClass =
  'w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-800 outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60'

function getPlaceholder(test) {
  if (!test) return 'Selecciona cuerpo y sexo primero'
  if (test.tipoEntrada === 'time') {
    return test.formatoTiempo === 'minutesSeconds' ? 'Ejemplo: 3:25 o 3.25' : 'Ejemplo: 7.84'
  }
  if (test.tipoEntrada === 'distance') return 'Ejemplo: 2.35'
  if (test.tipoEntrada === 'suspensionSeconds') return 'Ejemplo: 42.5'
  if (test.tipoEntrada === 'repetitions') return 'Ejemplo: 14'
  return 'Introduce tu marca'
}

function CalculadoraPage({ profile, user, onSaveMark, onGoProfile }) {
  const [cuerpoId, setCuerpoId] = useState('')
  const [sexo, setSexo] = useState(profile?.sexo ?? '')
  const [pruebaId, setPruebaId] = useState('')
  const [marca, setMarca] = useState('')
  const [error, setError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [result, setResult] = useState(null)

  const pruebas = useMemo(() => getTestsForSelection(cuerpoId, sexo), [cuerpoId, sexo])
  const selectedTest = useMemo(() => pruebas.find((t) => t.id === pruebaId) ?? null, [pruebas, pruebaId])

  const onChangeBody = (e) => {
    setCuerpoId(e.target.value)
    setPruebaId('')
    setMarca('')
    setResult(null)
    setError('')
    setSaveMessage('')
  }

  const onChangeSexo = (e) => {
    setSexo(e.target.value)
    setPruebaId('')
    setMarca('')
    setResult(null)
    setError('')
    setSaveMessage('')
  }

  const onChangePrueba = (e) => {
    setPruebaId(e.target.value)
    setMarca('')
    setResult(null)
    setError('')
    setSaveMessage('')
  }

  const onCalculate = (e) => {
    e.preventDefault()

    const basic = validateForm({ cuerpoId, sexo, pruebaId, marca })
    if (!basic.ok) {
      setError(basic.error)
      setResult(null)
      return
    }

    if (!selectedTest) {
      setError('La prueba seleccionada no es válida para ese cuerpo y sexo.')
      setResult(null)
      return
    }

    const normalized = validateMark(marca, selectedTest)
    if (!normalized.ok) {
      setError(normalized.error)
      setResult(null)
      return
    }

    const calc = getResultadoByBody({
      cuerpoId,
      sexo,
      pruebaId,
      mark: normalized.value,
    })

    if (!calc.ok) {
      setError(calc.error)
      setResult(null)
      return
    }

    const cuerpoNombre = cuerpos.find((c) => c.id === cuerpoId)?.nombre ?? cuerpoId
    setError('')
    setSaveMessage('')
    setResult({
      ...calc,
      cuerpoNombre,
      cuerpoId,
      sexo,
      pruebaId,
      pruebaNombre: selectedTest.nombre,
      marcaNormalizada: normalized.value,
      marcaMostrada: formatMarkDisplay(marca, normalized.value, selectedTest),
    })
    logAnalyticsEvent('public_score_calculated', { cuerpo: cuerpoId, prueba: pruebaId })
  }

  const onSaveResult = async () => {
    if (!result) return

    try {
      await onSaveMark({
        cuerpoId: result.cuerpoId,
        cuerpoNombre: result.cuerpoNombre,
        sexo: result.sexo,
        pruebaId: result.pruebaId,
        pruebaNombre: result.pruebaNombre,
        tipoResultado: result.tipo,
        nota: result.nota ?? null,
        esApto: result.esApto,
        marcaNormalizada: result.marcaNormalizada,
        marcaMostrada: result.marcaMostrada,
      })

      setSaveMessage('Marca guardada en el perfil correctamente.')
    } catch {
      setSaveMessage('No se pudo guardar la marca. Revisa Firebase e inténtalo de nuevo.')
    }
  }

  const onClear = () => {
    setMarca('')
    setResult(null)
    setError('')
    setSaveMessage('')
  }

  return (
    <div className="space-y-4">
      <SectionCard
        title="Calculadora"
        subtitle="Pruebas estrictamente separadas por cuerpo y sexo"
      >
        <form className="space-y-4" onSubmit={onCalculate}>
          <FormField label="1. Cuerpo">
            <select className={inputClass} value={cuerpoId} onChange={onChangeBody}>
              <option value="">Selecciona un cuerpo</option>
              {cuerpos.map((cuerpo) => (
                <option key={cuerpo.id} value={cuerpo.id}>
                  {cuerpo.nombre}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="2. Sexo">
            <select className={inputClass} value={sexo} onChange={onChangeSexo} disabled={!cuerpoId}>
              <option value="">Selecciona sexo</option>
              {sexos.map((sexoItem) => (
                <option key={sexoItem} value={sexoItem}>
                  {sexoItem}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="3. Prueba">
            <select
              className={inputClass}
              value={pruebaId}
              onChange={onChangePrueba}
              disabled={!cuerpoId || !sexo || pruebas.length === 0}
            >
              <option value="">Selecciona prueba</option>
              {pruebas.map((prueba) => (
                <option key={prueba.id} value={prueba.id}>
                  {prueba.nombre}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="4. Marca">
            <input
              className={inputClass}
              type="text"
              value={marca}
              placeholder={getPlaceholder(selectedTest)}
              onChange={(e) => {
                setMarca(e.target.value)
                setResult(null)
                setError('')
              }}
              disabled={!selectedTest}
            />
          </FormField>

          {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p> : null}
          {saveMessage ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{saveMessage}</p> : null}

          <div className="grid grid-cols-2 gap-3">
            <AppButton type="submit">Calcular</AppButton>
            <AppButton type="button" variant="secondary" onClick={onClear}>
              Limpiar
            </AppButton>
          </div>
        </form>
      </SectionCard>

      <ResultCard result={result} />

      {result ? (
        <ConversionCard
          user={user}
          title="¿Quieres mejorar esta marca?"
          description="Planificación adaptada a tu oposición, tu nivel actual y la fecha de tus pruebas."
          primaryLabel="Crear mi plan gratis"
          registeredLabel="Guardar marca en mi perfil"
          onPrimary={user?.isAnonymous ? () => onGoProfile({
            cuerpoId: result.cuerpoId,
            sexo: result.sexo,
            pruebaId: result.pruebaId,
            marcaActual: result.marcaNormalizada,
          }) : onSaveResult}
        />
      ) : null}
    </div>
  )
}

export default CalculadoraPage
