import { useMemo, useState } from 'react'
import AppButton from '../components/ui/AppButton'
import FormField from '../components/ui/FormField'
import SectionCard from '../components/ui/SectionCard'
import { useLocalStorageState } from '../hooks/useLocalStorageState'

const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const inputClass =
  'w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

function getPlannedSession(day, profile) {
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

function calculateActivityLoad(activity) {
  const duration = Number(activity.duration) || 0
  const rpe = Number(activity.rpe) || 5
  return Math.round(duration * rpe)
}

function CalendarioPage({ profile }) {
  const [activities, setActivities] = useLocalStorageState('training-calendar-activities-v1', [])
  const [selectedDay, setSelectedDay] = useState(null)
  const [form, setForm] = useState({ sport: 'Carrera', distance: '', duration: '', avgHr: '', rpe: '6', watts: '' })

  const plannedWeek = useMemo(
    () => days.map((day) => ({ day, planned: getPlannedSession(day, profile), activity: activities.find((item) => item.day === day) })),
    [activities, profile],
  )

  const metrics = useMemo(() => {
    const plannedLoad = plannedWeek.reduce((sum, item) => sum + (item.planned?.load ?? 0), 0)
    const realLoad = plannedWeek.reduce((sum, item) => sum + (item.activity ? calculateActivityLoad(item.activity) : 0), 0)
    const missed = plannedWeek.filter((item) => item.planned && !item.activity).length
    const completed = plannedWeek.filter((item) => item.activity).length
    const fatigue = plannedLoad ? Math.round((realLoad / plannedLoad) * 100) : 0
    const recommendation =
      fatigue > 125
        ? 'Riesgo de sobreentrenamiento: reduce intensidad o toma descanso.'
        : fatigue < 65 && missed > 0
          ? 'Carga baja: reubica una sesión suave en los días disponibles restantes.'
          : completed >= 3
            ? 'Semana equilibrada: mantén recuperación y técnica.'
            : 'Empieza completando las sesiones clave sin forzar máximos.'

    return { plannedLoad, realLoad, missed, completed, fatigue, recommendation }
  }, [plannedWeek])

  const openDay = (day) => {
    const current = activities.find((item) => item.day === day)
    setSelectedDay(day)
    setForm(current ?? { sport: 'Carrera', distance: '', duration: '', avgHr: '', rpe: '6', watts: '' })
  }

  const saveActivity = (event) => {
    event.preventDefault()
    setActivities((prev) => [{ ...form, day: selectedDay, source: 'manual', updatedAt: new Date().toISOString() }, ...prev.filter((item) => item.day !== selectedDay)])
    setSelectedDay(null)
  }

  const removeActivity = () => {
    setActivities((prev) => prev.filter((item) => item.day !== selectedDay))
    setSelectedDay(null)
  }

  const connectStrava = () => {
    const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID
    if (!clientId) {
      window.alert('Configura VITE_STRAVA_CLIENT_ID en Vercel para activar Strava.')
      return
    }
    const redirectUri = `${window.location.origin}/api/strava/callback`
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      approval_prompt: 'auto',
      scope: 'read,activity:read_all',
    })
    window.location.href = `https://www.strava.com/oauth/authorize?${params.toString()}`
  }

  return (
    <div className="space-y-4">
      <SectionCard title="Calendario inteligente" subtitle="Plan semanal, Strava y registro manual">
        <div className="grid gap-3 sm:grid-cols-2">
          <AppButton type="button" onClick={connectStrava}>Conectar con Strava</AppButton>
          <AppButton type="button" variant="secondary" onClick={() => openDay(days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1])}>
            Añadir actividad manual
          </AppButton>
        </div>
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

      <SectionCard title="Semana" subtitle="Pulsa un día para completar o ajustar datos">
        <div className="grid gap-3 md:grid-cols-2">
          {plannedWeek.map((item) => (
            <button
              key={item.day}
              type="button"
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left text-sm text-slate-700"
              onClick={() => openDay(item.day)}
            >
              <p className="font-extrabold text-brand-900">{item.day}</p>
              <p>Plan: {item.planned ? `${item.planned.title} (${item.planned.type})` : 'Descanso / movilidad opcional'}</p>
              <p>Real: {item.activity ? `${item.activity.sport} · ${item.activity.duration} min · RPE ${item.activity.rpe}` : 'Sin completar'}</p>
            </button>
          ))}
        </div>
      </SectionCard>

      {selectedDay ? (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-900/50 p-3 sm:items-center sm:justify-center">
          <form className="max-h-[90svh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl" onSubmit={saveActivity}>
            <h2 className="text-xl font-extrabold text-brand-900">Actividad de {selectedDay}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <FormField label="Deporte"><input className={inputClass} value={form.sport} onChange={(e) => setForm((p) => ({ ...p, sport: e.target.value }))} /></FormField>
              <FormField label="Distancia (km)"><input className={inputClass} type="number" step="0.01" value={form.distance} onChange={(e) => setForm((p) => ({ ...p, distance: e.target.value }))} /></FormField>
              <FormField label="Duración (min)"><input className={inputClass} type="number" value={form.duration} onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))} /></FormField>
              <FormField label="FC media"><input className={inputClass} type="number" value={form.avgHr} onChange={(e) => setForm((p) => ({ ...p, avgHr: e.target.value }))} /></FormField>
              <FormField label="RPE 1-10"><input className={inputClass} type="number" min="1" max="10" value={form.rpe} onChange={(e) => setForm((p) => ({ ...p, rpe: e.target.value }))} /></FormField>
              <FormField label="Vatios"><input className={inputClass} type="number" value={form.watts} onChange={(e) => setForm((p) => ({ ...p, watts: e.target.value }))} /></FormField>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <AppButton type="submit">Guardar</AppButton>
              <AppButton type="button" variant="secondary" onClick={removeActivity}>Borrar</AppButton>
              <AppButton type="button" variant="secondary" onClick={() => setSelectedDay(null)}>Cerrar</AppButton>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}

export default CalendarioPage
