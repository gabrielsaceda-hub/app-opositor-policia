import { useMemo, useState } from 'react'
import AppButton from '../components/ui/AppButton'
import SectionCard from '../components/ui/SectionCard'
import { buildTrainingPlan } from '../services/training/trainingPlanner'

const readinessStyle = {
  'Sólida': 'bg-emerald-100 text-emerald-800',
  'En camino': 'bg-amber-100 text-amber-800',
  'Frágil': 'bg-rose-100 text-rose-800',
  'Sin datos': 'bg-slate-100 text-slate-600',
}

const factorMark = {
  bueno: { symbol: '✓', className: 'text-emerald-700' },
  regular: { symbol: '~', className: 'text-amber-700' },
  malo: { symbol: '✗', className: 'text-rose-700' },
  nodata: { symbol: '·', className: 'text-slate-400' },
  info: { symbol: '·', className: 'text-slate-400' },
}

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

function EntrenadorPage({ profile, savedMarks, activities, wellbeing, onGoProfile }) {
  const [mode, setMode] = useState('today')
  const plan = useMemo(() => buildTrainingPlan({ profile, savedMarks, activities, wellbeing }), [profile, savedMarks, activities, wellbeing])

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
            {plan.daysToExam === null
              ? 'sin fecha definida'
              : `faltan ${plan.daysToExam} días${plan.examDateLabel ? ` (${plan.examDateLabel})` : ''}`}
          </p>
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="font-semibold text-slate-700">
              Semana: {plan.progress.completed}/{plan.progress.planned} sesiones ({plan.progress.percent}%)
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={plan.progress.percent} aria-valuemin="0" aria-valuemax="100">
              <div className="h-full rounded-full bg-brand-600" style={{ width: `${plan.progress.percent}%` }} />
            </div>
          </div>
          <p className="rounded-2xl bg-brand-50 p-3 font-semibold text-brand-900">
            Prioridad actual: {plan.mainPriority}
          </p>
          <p className={`rounded-2xl p-3 font-semibold ${plan.recovery.level === 'alta' ? 'bg-rose-50 text-rose-800' : 'bg-slate-50 text-slate-700'}`}>
            Recuperación: {plan.recovery.message}
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

      <SectionCard title="Nivel de preparación" subtitle="Foto honesta según tus datos, sin predicciones">
        <p className={`rounded-2xl px-4 py-3 text-center text-lg font-extrabold ${readinessStyle[plan.readiness.level] ?? readinessStyle['Sin datos']}`}>
          Proyección actual: {plan.readiness.level}
        </p>
        <div className="mt-3 space-y-2 text-sm text-slate-700">
          {plan.readiness.factors.map((factor) => (
            <p key={factor.id}>
              <strong className={factorMark[factor.status]?.className ?? 'text-slate-500'}>
                {factorMark[factor.status]?.symbol ?? '·'} {factor.label}:
              </strong>{' '}
              {factor.detail}
            </p>
          ))}
        </div>
      </SectionCard>

      {mode === 'today' ? (
        <>
          <SectionCard title={`Entreno de hoy${plan.today.date ? ` (${plan.today.date.split('-').reverse().join('/')})` : ''}`} subtitle="Sesión recomendada según tu punto débil">
            <SessionCard session={plan.today} />
          </SectionCard>
          {plan.tomorrow ? (
            <SectionCard title={`Mañana: ${plan.tomorrow.day}`} subtitle={`Carga ${plan.tomorrow.load}`}>
              <SessionCard session={plan.tomorrow} />
            </SectionCard>
          ) : null}
        </>
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
