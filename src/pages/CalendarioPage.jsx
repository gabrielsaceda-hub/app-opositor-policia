import { useEffect, useMemo, useState } from 'react'
import AppButton from '../components/ui/AppButton'
import FormField from '../components/ui/FormField'
import SectionCard from '../components/ui/SectionCard'
import { auth } from '../services/firebase/firebaseClient'
import { getTestsForSelection } from '../data/tests'
import { buildTrainingPlan } from '../services/training/trainingPlanner'

const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const inputClass =
  'w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

function formatLocalDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function todayStr() {
  return formatLocalDate(new Date())
}

function getWeekDate(dayIndex) {
  const now = new Date()
  const currentDay = now.getDay() === 0 ? 6 : now.getDay() - 1
  const monday = new Date(now)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(now.getDate() - currentDay + dayIndex)
  return formatLocalDate(monday)
}

function legacyPlannedSession(day, profile) {
  const available = profile.diasEntreno?.length ? profile.diasEntreno : ['Lunes', 'Miércoles', 'Viernes']
  if (!available.includes(day)) return null
  const index = available.indexOf(day)
  const templates = [
    { type: 'intenso', title: 'Calidad específica', load: 80 },
    { type: 'fuerza', title: 'Fuerza + técnica', load: 65 },
    { type: 'suave', title: 'Rodaje / movilidad', load: 40 },
    { type: 'mixto', title: 'Prueba prioritaria', load: 70 },
  ]
  return templates[index % templates.length]
}

function loadToNumber(load) {
  if (/suave/i.test(load)) return 40
  if (/moderada/i.test(load)) return 65
  return 75
}

function calculateActivityLoad(activity) {
  const duration = Number(activity.duration) || 0
  const rpe = Number(activity.rpe) || 5
  return Math.round(duration * rpe)
}

function isDoneActivity(activity) {
  return activity.status !== 'no-realizada'
}

function CalendarioPage({ user, profile, savedMarks = [], activities = [], wellbeing = [], onSaveActivity, onDeleteActivity, onSaveWellbeing, onSyncStrava }) {
  const [selectedDay, setSelectedDay] = useState(null)
  const [form, setForm] = useState({ sport: 'Carrera', distance: '', duration: '', avgHr: '', rpe: '6', watts: '', status: 'completada', notes: '', testId: '' })
  const [wellbeingForm, setWellbeingForm] = useState({ date: getWeekDate(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1), sleepHours: '', sleepQuality: '', fatigue: '5', soreness: '1' })
  const [message, setMessage] = useState('')
  const [stravaMessage, setStravaMessage] = useState(() => new URLSearchParams(window.location.search).get('strava') === 'connected' ? 'Strava conectado. Sincronizando actividades…' : '')

  const plan = useMemo(
    () => buildTrainingPlan({ profile, savedMarks, activities, wellbeing }),
    [profile, savedMarks, activities, wellbeing],
  )
  const availableTests = useMemo(
    () => getTestsForSelection(profile.cuerpoObjetivo, profile.sexo),
    [profile.cuerpoObjetivo, profile.sexo],
  )

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('strava') !== 'connected') return
    window.history.replaceState({}, '', window.location.pathname)
    Promise.resolve(onSyncStrava?.())
      .then((count) => setStravaMessage(`Strava conectado. ${count} actividades sincronizadas.`))
      .catch(() => setStravaMessage('Strava conectado, pero no se pudieron sincronizar las actividades.'))
  }, [onSyncStrava])

  const plannedWeek = useMemo(() => {
    const today = todayStr()
    const week = days.map((day, index) => {
      const date = getWeekDate(index)
      let planned = null
      if (plan.ok) {
        const session = plan.weeklyPlan.find((item) => item.day === day)
        if (session) {
          planned = { type: 'plan', title: session.title, load: loadToNumber(session.load), detail: session.load }
        }
      } else {
        planned = legacyPlannedSession(day, profile)
      }
      const dayActivities = activities
        .filter((item) => item.date === date || (!item.date && item.day === day))
        .sort((a, b) => String(a.id ?? '').localeCompare(String(b.id ?? '')))
      return { day, date, planned, reubicada: null, activities: dayActivities }
    })

    // Reubicación real: la primera sesión omitida con fecha pasada se mueve
    // al primer día de descanso disponible de la misma semana.
    const missed = week.filter((item) => item.planned && item.date < today && !item.activities.some(isDoneActivity))
    const restDays = week.filter((item) => !item.planned && item.date >= today && !item.activities.some(isDoneActivity))
    let moved = null
    if (missed.length > 0 && restDays.length > 0) {
      const target = restDays[0]
      target.planned = { ...missed[0].planned }
      target.reubicada = missed[0].day
      moved = { from: missed[0].day, to: target.day }
    }

    return { week, moved }
  }, [activities, plan, profile])

  const metrics = useMemo(() => {
    const { week, moved } = plannedWeek
    const plannedLoad = week.reduce((sum, item) => sum + (item.planned?.load ?? 0), 0)
    const realLoad = week.reduce(
      (sum, item) => sum + item.activities.filter(isDoneActivity).reduce((inner, activity) => inner + calculateActivityLoad(activity), 0),
      0,
    )
    const missed = week.filter((item) => item.planned && !item.activities.some(isDoneActivity)).length
    const completed = week.filter((item) => item.activities.some(isDoneActivity)).length
    const fatigue = plannedLoad ? Math.round((realLoad / plannedLoad) * 100) : 0
    const recommendation =
      fatigue > 125
        ? 'Riesgo de sobreentrenamiento: reduce intensidad o toma descanso.'
        : moved
          ? `Carga baja: se ha reubicado la sesión de ${moved.from} en ${moved.to}.`
          : fatigue < 65 && missed > 0
            ? 'Carga baja: completa alguna sesión pendiente sin forzar máximos.'
            : completed >= 3
              ? 'Semana equilibrada: mantén recuperación y técnica.'
              : 'Empieza completando las sesiones clave sin forzar máximos.'

    return { plannedLoad, realLoad, missed, completed, fatigue, recommendation, moved }
  }, [plannedWeek])

  const findFreeActivityId = (date) => {
    if (!activities.some((item) => item.id === date)) return date
    let index = 2
    while (activities.some((item) => item.id === `${date}-${index}`)) index += 1
    return `${date}-${index}`
  }

  const emptyForm = { sport: 'Carrera', distance: '', duration: '', avgHr: '', rpe: '6', watts: '', status: 'completada', notes: '', testId: '' }

  const openDay = ({ day, date }) => {
    const current = activities.find((item) => item.date === date) ?? activities.find((item) => !item.date && item.day === day)
    setSelectedDay({ day, date, activityId: current?.id ?? date, isExtra: false })
    setForm(current ? {
      sport: current.sport ?? 'Carrera',
      distance: current.distance ?? '',
      duration: current.duration ?? '',
      avgHr: current.avgHr ?? '',
      rpe: current.rpe ?? '6',
      watts: current.watts ?? '',
      status: current.status ?? 'completada',
      notes: current.notes ?? '',
      testId: current.testId ?? '',
    } : { ...emptyForm })
    setMessage('')
  }

  const addExtraSession = () => {
    if (!selectedDay) return
    setSelectedDay({ ...selectedDay, activityId: findFreeActivityId(selectedDay.date), isExtra: true })
    setForm({ ...emptyForm })
    setMessage('')
  }

  const saveActivity = async (event) => {
    event.preventDefault()
    if (!selectedDay || Number(form.duration) <= 0) {
      setMessage('Introduce una duración válida para guardar la actividad.')
      return
    }
    if (Number(form.rpe) < 1 || Number(form.rpe) > 10) {
      setMessage('El RPE debe estar entre 1 y 10.')
      return
    }
    try {
      await onSaveActivity(selectedDay.activityId, { ...form, day: selectedDay.day, date: selectedDay.date, source: 'manual' })
      setMessage(form.status === 'no-realizada' ? 'Sesión marcada como no realizada.' : 'Actividad guardada en tu cuenta.')
    } catch {
      setMessage('No se pudo guardar la actividad. Revisa Firebase e inténtalo de nuevo.')
      return
    }
    setSelectedDay(null)
  }

  const removeActivity = async () => {
    if (!selectedDay?.activityId) return
    try {
      await onDeleteActivity(selectedDay.activityId)
      setMessage('Actividad eliminada.')
    } catch {
      setMessage('No se pudo eliminar la actividad.')
      return
    }
    setSelectedDay(null)
  }

  const saveWellbeing = async (event) => {
    event.preventDefault()
    if (!wellbeingForm.date || Number(wellbeingForm.sleepHours) < 0 || Number(wellbeingForm.sleepHours) > 24) {
      setMessage('Introduce horas de sueño entre 0 y 24.')
      return
    }
    try {
      await onSaveWellbeing(wellbeingForm.date, wellbeingForm)
      setMessage('Sueño y sensaciones guardados.')
    } catch {
      setMessage('No se pudo guardar el registro de bienestar.')
    }
  }

  const connectStrava = async () => {
    if (user?.isAnonymous) {
      setStravaMessage('Inicia sesión con Google antes de conectar Strava para vincular tus actividades a tu cuenta.')
      return
    }
    try {
      const token = await auth.currentUser?.getIdToken()
      const result = await fetch('/api/strava/start', { headers: { Authorization: `Bearer ${token}` } })
      const payload = await result.json()
      if (!result.ok) throw new Error(payload.error)
      window.location.href = payload.url
    } catch {
      setStravaMessage('No se pudo iniciar la conexión con Strava. Revisa la configuración.')
    }
  }

  const syncStrava = async () => {
    const count = await onSyncStrava?.()
    setStravaMessage(`Sincronización completada: ${count ?? 0} actividades.`)
  }

  const today = todayStr()

  return (
    <div className="space-y-4">
      <SectionCard title="Calendario inteligente" subtitle="Plan semanal, Strava y registro manual">
        <div className="grid gap-3 sm:grid-cols-2">
          <AppButton type="button" onClick={connectStrava}>Conectar con Strava</AppButton>
          <AppButton type="button" variant="secondary" onClick={syncStrava}>Sincronizar Strava</AppButton>
          <AppButton type="button" variant="secondary" onClick={() => {
            const index = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
            openDay(plannedWeek.week[index])
          }}>
            Añadir actividad manual
          </AppButton>
        </div>
        {stravaMessage ? <p className="mt-3 rounded-xl bg-brand-50 p-3 text-sm font-semibold text-brand-900">{stravaMessage}</p> : null}
      </SectionCard>

      <SectionCard title="Carga y fatiga" subtitle="Estimación simple en tiempo real">
        <div className="grid grid-cols-2 gap-3 text-sm text-slate-700 sm:grid-cols-4">
          <p className="rounded-2xl bg-slate-50 p-3"><strong>Plan:</strong> {metrics.plannedLoad}</p>
          <p className="rounded-2xl bg-slate-50 p-3"><strong>Real:</strong> {metrics.realLoad}</p>
          <p className="rounded-2xl bg-slate-50 p-3"><strong>Fatiga:</strong> {metrics.fatigue}%</p>
          <p className="rounded-2xl bg-slate-50 p-3"><strong>Hechas:</strong> {metrics.completed}</p>
        </div>
        <p className="mt-3 rounded-2xl bg-brand-50 p-3 text-sm font-bold text-brand-900">{metrics.recommendation}</p>
      </SectionCard>

      <SectionCard title="Sueño y bienestar" subtitle="Registra tu recuperación para contextualizar la carga">
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={saveWellbeing}>
          <FormField label="Fecha">
            <input className={inputClass} type="date" value={wellbeingForm.date} onChange={(event) => setWellbeingForm((prev) => ({ ...prev, date: event.target.value }))} />
          </FormField>
          <FormField label="Horas de sueño">
            <input className={inputClass} type="number" min="0" max="24" step="0.5" value={wellbeingForm.sleepHours} onChange={(event) => setWellbeingForm((prev) => ({ ...prev, sleepHours: event.target.value }))} />
          </FormField>
          <FormField label="Calidad de sueño">
            <select className={inputClass} value={wellbeingForm.sleepQuality} onChange={(event) => setWellbeingForm((prev) => ({ ...prev, sleepQuality: event.target.value }))}>
              <option value="">Sin indicar</option>
              <option value="buena">Buena</option>
              <option value="regular">Regular</option>
              <option value="mala">Mala</option>
            </select>
          </FormField>
          <FormField label="Fatiga percibida 1-10">
            <input className={inputClass} type="number" min="1" max="10" value={wellbeingForm.fatigue} onChange={(event) => setWellbeingForm((prev) => ({ ...prev, fatigue: event.target.value }))} />
          </FormField>
          <FormField label="Molestias 1-10">
            <input className={inputClass} type="number" min="1" max="10" value={wellbeingForm.soreness} onChange={(event) => setWellbeingForm((prev) => ({ ...prev, soreness: event.target.value }))} />
          </FormField>
          <div>
            <AppButton type="submit">Guardar bienestar</AppButton>
          </div>
        </form>
        {wellbeing.length > 0 ? <p className="mt-3 text-xs text-slate-500">Último registro: {wellbeing[0].date} · sueño {wellbeing[0].sleepHours || '—'} h{wellbeing[0].sleepQuality ? ` (${wellbeing[0].sleepQuality})` : ''} · fatiga {wellbeing[0].fatigue || '—'}/10</p> : null}
      </SectionCard>

      <SectionCard title="Semana" subtitle="Pulsa un día para completar o ajustar datos">
        <div className="grid gap-3 md:grid-cols-2">
          {plannedWeek.week.map((item) => (
            <button
              key={item.day}
              type="button"
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left text-sm text-slate-700"
              onClick={() => openDay(item)}
            >
              <p className="font-extrabold text-brand-900">
                {item.day}{item.date === today ? ' · Hoy' : ''}
              </p>
              <p>Plan: {item.planned ? `${item.planned.title}` : 'Descanso / movilidad opcional'}{item.reubicada ? ` (reubicada de ${item.reubicada})` : ''}</p>
              {item.activities.length === 0 ? (
                <p>Real: Sin completar</p>
              ) : (
                item.activities.map((activity) => (
                  <p key={activity.id}>
                    Real: {activity.sport} · {activity.duration} min · RPE {activity.rpe}
                    {activity.status === 'no-realizada' ? ' (no realizada)' : ''}
                  </p>
                ))
              )}
            </button>
          ))}
        </div>
      </SectionCard>

      {message ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{message}</p> : null}

      {selectedDay ? (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-900/50 p-3 sm:items-center sm:justify-center">
          <form className="max-h-[90svh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl" onSubmit={saveActivity}>
            <h2 className="text-xl font-extrabold text-brand-900">Actividad de {selectedDay.day}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <FormField label="Estado">
                <select className={inputClass} value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                  <option value="completada">Completada</option>
                  <option value="no-realizada">No realizada</option>
                </select>
              </FormField>
              <FormField label="Prueba relacionada">
                <select className={inputClass} value={form.testId} onChange={(e) => setForm((p) => ({ ...p, testId: e.target.value }))}>
                  <option value="">Sin prueba</option>
                  {availableTests.map((test) => (
                    <option key={test.id} value={test.id}>{test.nombre}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Deporte"><input className={inputClass} value={form.sport} onChange={(e) => setForm((p) => ({ ...p, sport: e.target.value }))} /></FormField>
              <FormField label="Distancia (km)"><input className={inputClass} type="number" step="0.01" value={form.distance} onChange={(e) => setForm((p) => ({ ...p, distance: e.target.value }))} /></FormField>
              <FormField label="Duración (min)"><input className={inputClass} type="number" value={form.duration} onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))} /></FormField>
              <FormField label="FC media"><input className={inputClass} type="number" value={form.avgHr} onChange={(e) => setForm((p) => ({ ...p, avgHr: e.target.value }))} /></FormField>
              <FormField label="RPE 1-10"><input className={inputClass} type="number" min="1" max="10" value={form.rpe} onChange={(e) => setForm((p) => ({ ...p, rpe: e.target.value }))} /></FormField>
              <FormField label="Vatios"><input className={inputClass} type="number" value={form.watts} onChange={(e) => setForm((p) => ({ ...p, watts: e.target.value }))} /></FormField>
              <div className="sm:col-span-2">
                <FormField label="Notas"><input className={inputClass} value={form.notes} placeholder="Sensaciones, series, incidencias…" onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} /></FormField>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <AppButton type="submit">Guardar</AppButton>
              <AppButton type="button" variant="secondary" onClick={removeActivity}>Borrar</AppButton>
              <AppButton type="button" variant="secondary" onClick={() => setSelectedDay(null)}>Cerrar</AppButton>
            </div>
            {!selectedDay.isExtra ? (
              <div className="mt-2">
                <AppButton type="button" variant="secondary" onClick={addExtraSession}>＋ Añadir otra sesión este día</AppButton>
              </div>
            ) : null}
          </form>
        </div>
      ) : null}
    </div>
  )
}

export default CalendarioPage
