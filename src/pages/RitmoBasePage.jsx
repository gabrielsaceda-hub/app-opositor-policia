import { useMemo, useState } from 'react'
import AppButton from '../components/ui/AppButton'
import FormField from '../components/ui/FormField'
import SectionCard from '../components/ui/SectionCard'
import { useLocalStorageState } from '../hooks/useLocalStorageState'
import { formatSecondsAsMinSec } from '../utils/formatters'
import { getBasePacesByDistance, getEightHundredSeconds } from '../services/rhythm/basePaceService'
import {
  getSeasonPhaseByWeeks,
  getWeekIntensityFactor,
  getWeeksToExam,
} from '../services/rhythm/seasonPhaseService'
import {
  buildSessionPaces,
  getSessionById,
  getSessionsForPhase,
  getSuggestedSessionForToday,
} from '../services/rhythm/sessionService'
import { allSessionTemplates } from '../data/rhythm/sessionTemplates'
import { parseCustomSessionText } from '../services/rhythm/customSessionParser'
import ConversionCard from '../components/conversion/ConversionCard'
import { logAnalyticsEvent } from '../services/firebase/firebaseClient'

const inputClass =
  'w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-800 outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

function RitmoBasePage({ user, onGoProfile, onGoTrainer }) {
  const [marca800, setMarca800] = useLocalStorageState('ritmo-base-marca-800', '')
  const [fechaExamen, setFechaExamen] = useLocalStorageState('ritmo-base-fecha-examen', '')
  const [mode, setMode] = useState('hoy')
  const [calcSource, setCalcSource] = useState('propuesta')
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [customSessionText, setCustomSessionText] = useState('')
  const [error, setError] = useState('')

  const parsedMark = useMemo(() => getEightHundredSeconds(marca800), [marca800])
  const weeksRemaining = useMemo(() => getWeeksToExam(fechaExamen), [fechaExamen])
  const phase = useMemo(() => getSeasonPhaseByWeeks(weeksRemaining), [weeksRemaining])
  const weekIntensityFactor = useMemo(
    () => getWeekIntensityFactor(weeksRemaining, phase?.id),
    [weeksRemaining, phase],
  )
  const basePaces = useMemo(
    () => (parsedMark.ok ? getBasePacesByDistance(parsedMark.value) : null),
    [parsedMark],
  )

  const phaseSessions = useMemo(() => getSessionsForPhase(phase?.id), [phase])

  const suggestedSession = useMemo(
    () => (phase ? getSuggestedSessionForToday(phase.id) : null),
    [phase],
  )

  const selectedSession = useMemo(
    () => (selectedSessionId ? getSessionById(selectedSessionId) : null),
    [selectedSessionId],
  )

  const parsedCustomSession = useMemo(
    () => parseCustomSessionText(customSessionText),
    [customSessionText],
  )

  const calculatedSession = useMemo(() => {
    if (calcSource === 'propuesta') return selectedSession
    if (parsedCustomSession.ok) return parsedCustomSession.session
    return null
  }, [calcSource, selectedSession, parsedCustomSession])

  const sessionToDisplay = mode === 'hoy' ? suggestedSession : calculatedSession

  const sessionBlocks = useMemo(
    () =>
      basePaces ? buildSessionPaces(sessionToDisplay, basePaces, weekIntensityFactor) : [],
    [sessionToDisplay, basePaces, weekIntensityFactor],
  )

  const validateInputs = () => {
    if (!marca800) return 'Debes introducir tu marca personal de 800 m.'
    if (!parsedMark.ok) return parsedMark.error
    if (!fechaExamen) return 'Debes indicar una fecha aproximada de examen.'
    if (weeksRemaining === null) return 'La fecha aproximada de examen no es válida.'

    if (mode === 'calcula') {
      if (calcSource === 'propuesta' && !selectedSessionId) {
        return 'Selecciona una sesión propuesta para calcular ritmos.'
      }

      if (calcSource === 'personal' && !parsedCustomSession.ok) {
        return parsedCustomSession.error
      }
    }

    return ''
  }

  const handleValidate = () => {
    const validationError = validateInputs()
    setError(validationError)
    if (!validationError) logAnalyticsEvent('public_pace_calculated', { distance: '800' })
  }

  const shouldShowResults = !validateInputs()

  return (
    <div className="space-y-4">
      <SectionCard
        title="Mi ritmo base"
        subtitle="Calcula ritmos y adapta tu entrenamiento según tu fase"
      >
        <div className="space-y-4">
          <FormField label="Marca personal 800 m">
            <input
              className={inputClass}
              type="text"
              value={marca800}
              placeholder="Ejemplo: 2:25"
              onChange={(event) => {
                setMarca800(event.target.value)
                setError('')
              }}
            />
          </FormField>

          <FormField label="Fecha aproximada de examen">
            <input
              className={inputClass}
              type="date"
              value={fechaExamen}
              onChange={(event) => {
                setFechaExamen(event.target.value)
                setError('')
              }}
            />
          </FormField>

          <AppButton type="button" onClick={handleValidate}>
            Actualizar ritmo base
          </AppButton>

          {error ? (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p>
          ) : null}
        </div>
      </SectionCard>

      {shouldShowResults && basePaces && phase ? (
        <>
          <SectionCard title="Ritmos base" subtitle="Ritmo objetivo estimado por distancia">
            <div className="grid grid-cols-2 gap-3 text-sm text-slate-700">
              {[100, 200, 300, 400].map((distance) => (
                <article key={distance} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="font-bold text-slate-800">{distance} m</p>
                  <p>{formatSecondsAsMinSec(basePaces[distance])}</p>
                </article>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Fase de temporada" subtitle="Detección automática según semanas restantes">
            <p className="text-sm text-slate-700">
              <strong>Semanas restantes:</strong> {weeksRemaining}
            </p>
            <p className="text-sm text-slate-700">
              <strong>Fase actual:</strong> {phase.nombre}
            </p>
            <p className="text-sm text-slate-700">
              <strong>Ajuste semanal aplicado:</strong> x{weekIntensityFactor.toFixed(2)}
            </p>
            <p className="mt-1 text-sm text-slate-600">{phase.description}</p>
          </SectionCard>

          <SectionCard title="Modo" subtitle="Elige cómo quieres usar la herramienta">
            <div className="grid grid-cols-2 gap-3">
              <AppButton
                type="button"
                variant={mode === 'hoy' ? 'primary' : 'secondary'}
                onClick={() => {
                  setMode('hoy')
                  setError('')
                }}
              >
                Qué entreno hoy
              </AppButton>
              <AppButton
                type="button"
                variant={mode === 'calcula' ? 'primary' : 'secondary'}
                onClick={() => {
                  setMode('calcula')
                  setError('')
                }}
              >
                Calcula mis ritmos
              </AppButton>
            </div>
          </SectionCard>

          {mode === 'calcula' ? (
            <SectionCard
              title="Cómo quieres calcular"
              subtitle="Puedes elegir sesión propuesta o escribir una personalizada"
            >
              <div className="grid grid-cols-2 gap-3">
                <AppButton
                  type="button"
                  variant={calcSource === 'propuesta' ? 'primary' : 'secondary'}
                  onClick={() => {
                    setCalcSource('propuesta')
                    setError('')
                  }}
                >
                  Sesión propuesta
                </AppButton>
                <AppButton
                  type="button"
                  variant={calcSource === 'personal' ? 'primary' : 'secondary'}
                  onClick={() => {
                    setCalcSource('personal')
                    setError('')
                  }}
                >
                  Sesión propia
                </AppButton>
              </div>

              {calcSource === 'propuesta' ? (
                <div className="mt-4 space-y-3">
                  <FormField label="Sesión propuesta">
                    <select
                      className={inputClass}
                      value={selectedSessionId}
                      onChange={(event) => {
                        setSelectedSessionId(event.target.value)
                        setError('')
                      }}
                    >
                      <option value="">Selecciona sesión</option>
                      {phaseSessions.map((session) => (
                        <option key={session.id} value={session.id}>
                          {session.name}
                        </option>
                      ))}
                      {phaseSessions.length === 0
                        ? allSessionTemplates.map((session) => (
                            <option key={session.id} value={session.id}>
                              {session.name}
                            </option>
                          ))
                        : null}
                    </select>
                  </FormField>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <FormField label="Escribe tu sesión (texto libre)">
                    <textarea
                      className={`${inputClass} min-h-28 resize-y`}
                      value={customSessionText}
                      placeholder="Ejemplo: 6x200 control + 3x400 fuerte"
                      onChange={(event) => {
                        setCustomSessionText(event.target.value)
                        setError('')
                      }}
                    />
                  </FormField>
                  <p className="text-xs text-slate-500">
                    También puedes dictarlo: "hoy quiero 4x300 y 3x200 fuerte".
                  </p>
                </div>
              )}
            </SectionCard>
          ) : null}

          {sessionToDisplay ? (
            <SectionCard
              title={mode === 'hoy' ? 'Sesión propuesta hoy' : 'Ritmos calculados para tu sesión'}
              subtitle={sessionToDisplay.name}
            >
              <div className="space-y-2 text-sm text-slate-700">
                {sessionBlocks.map((block, index) => (
                  <article
                    key={`${sessionToDisplay.id}-${index}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <p>
                      <strong>
                        {block.repeats} x {block.distance} m
                      </strong>{' '}
                      · objetivo {block.targetTime ? formatSecondsAsMinSec(block.targetTime) : 'N/D'}
                    </p>
                    <p className="text-slate-600">{block.note}</p>
                  </article>
                ))}
              </div>
            </SectionCard>
          ) : null}

          <ConversionCard
            user={user}
            title="Ya sabes el ritmo. Ahora toca llegar a él."
            description="Planifica tus entrenamientos hasta la fecha del examen teniendo en cuenta tu evolución y descanso."
            primaryLabel="Planificar cómo llegar a esta marca"
            registeredLabel="Ir a mi entrenador"
            onPrimary={user?.isAnonymous
              ? () => onGoProfile({ marca800, fechaExamen })
              : onGoTrainer}
          />
        </>
      ) : null}
    </div>
  )
}

export default RitmoBasePage
