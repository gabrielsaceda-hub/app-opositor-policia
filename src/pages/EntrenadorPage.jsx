import { useMemo, useState } from 'react'
import AppButton from '../components/ui/AppButton'
import SectionCard from '../components/ui/SectionCard'
import { buildTrainingPlan } from '../services/training/trainingPlanner'

function SessionCard({ session }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="font-extrabold text-slate-800">{session.title}</p>
      <div className="mt-3 space-y-2 text-sm text-slate-700">
        {session.blocks.map((block) => (
          <p key={block}>- {block}</p>
        ))}
      </div>
    </div>
  )
}

function EntrenadorPage({ profile, savedMarks, onGoProfile }) {
  const [mode, setMode] = useState('today')
  const plan = useMemo(() => buildTrainingPlan({ profile, savedMarks }), [profile, savedMarks])

  if (!plan.ok) {
    return (
      <SectionCard title="Entrenador" subtitle="Plan personalizado según tus datos y marcas">
        <p className="text-sm text-slate-600">{plan.error}</p>
        <div className="mt-4">
          <AppButton type="button" onClick={onGoProfile}>
            Completar perfil
          </AppButton>
        </div>
      </SectionCard>
    )
  }

  return (
    <div className="space-y-4">
      <SectionCard title="Entrenador" subtitle="Planificación deportiva para oposición">
        <div className="space-y-3 text-sm text-slate-700">
          <p>
            <strong>Fase:</strong> {plan.phase.name} · {plan.phase.focus}
          </p>
          <p>
            <strong>Examen previsto:</strong>{' '}
            {plan.weeksToExam === null ? 'sin fecha definida' : `${plan.weeksToExam} semanas`}
          </p>
          <p className="rounded-2xl bg-brand-50 p-3 font-semibold text-brand-900">
            Prioridad actual: {plan.mainPriority}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <AppButton type="button" variant={mode === 'today' ? 'primary' : 'secondary'} onClick={() => setMode('today')}>
            Hoy
          </AppButton>
          <AppButton type="button" variant={mode === 'week' ? 'primary' : 'secondary'} onClick={() => setMode('week')}>
            Semana
          </AppButton>
        </div>
      </SectionCard>

      {mode === 'today' ? (
        <SectionCard title="Entreno de hoy" subtitle="Sesión recomendada según tu punto débil">
          <SessionCard session={plan.today} />
        </SectionCard>
      ) : (
        <SectionCard title="Plan semanal" subtitle="Distribuido según tus días disponibles">
          <div className="space-y-3">
            {plan.weeklyPlan.map((session) => (
              <div key={session.day} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-extrabold text-brand-900">
                  {session.day} · Carga {session.load}
                </p>
                <div className="mt-2">
                  <SessionCard session={session} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <SectionCard title="Nutrición deportiva" subtitle="Orientación general para rendir y recuperar">
        <div className="space-y-2 text-sm text-slate-700">
          {plan.nutrition.bmi ? (
            <p>
              <strong>IMC orientativo:</strong> {plan.nutrition.bmi.toFixed(1)}
            </p>
          ) : null}
          {plan.nutrition.tips.map((tip) => (
            <p key={tip}>- {tip}</p>
          ))}
          <p className="rounded-2xl bg-amber-50 p-3 font-semibold text-amber-800">{plan.nutrition.caution}</p>
        </div>
      </SectionCard>

      <SectionCard title="Control de carga" subtitle="Reglas de seguridad">
        <div className="space-y-2 text-sm text-slate-700">
          {plan.safetyNotes.map((note) => (
            <p key={note}>- {note}</p>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

export default EntrenadorPage
