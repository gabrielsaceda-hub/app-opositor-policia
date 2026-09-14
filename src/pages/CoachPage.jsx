import { useMemo, useState } from 'react'
import AppButton from '../components/ui/AppButton'
import SectionCard from '../components/ui/SectionCard'
import { auth } from '../services/firebase/firebaseClient'
import { buildAthleteSummary } from '../services/coach/athleteSummary'

function CoachPage({ user, profile, savedMarks, activities, wellbeing }) {
  const [question, setQuestion] = useState('¿Qué debería priorizar esta semana?')
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const summary = useMemo(
    () => buildAthleteSummary({ profile, savedMarks, activities, wellbeing }),
    [profile, savedMarks, activities, wellbeing],
  )

  const askCoach = async (event) => {
    event.preventDefault()
    if (!question.trim()) return
    setLoading(true)
    setError('')
    setAnswer('')
    try {
      const token = await auth.currentUser?.getIdToken()
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, summary }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error ?? 'coach-failed')
      setAnswer(payload.answer)
    } catch (requestError) {
      setError(requestError.message === 'AI provider is not configured'
        ? 'El Coach IA todavía no está configurado por el administrador.'
        : requestError.message === 'Daily Coach limit reached'
          ? 'Has alcanzado el límite diario de consultas. Inténtalo mañana.'
          : 'No se pudo consultar el Coach IA.')
    } finally {
      setLoading(false)
    }
  }

  if (user?.isAnonymous) {
    return (
      <SectionCard title="Coach IA" subtitle="Orientación educativa sobre tu preparación">
        <p className="text-sm text-slate-600">Inicia sesión con Google para guardar el contexto y consultar el Coach IA.</p>
      </SectionCard>
    )
  }

  return (
    <div className="space-y-4">
      <SectionCard title="Coach IA" subtitle="Orientación general basada en tus datos registrados">
        <p className="mb-4 rounded-2xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">No sustituye a un entrenador ni a profesionales sanitarios. No consultes aquí urgencias, lesiones graves ni tratamientos.</p>
        <form className="space-y-3" onSubmit={askCoach}>
          <textarea className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-800 outline-none focus:border-brand-500" rows="4" maxLength="1000" value={question} onChange={(event) => setQuestion(event.target.value)} />
          <AppButton type="submit" disabled={loading}>{loading ? 'Pensando...' : 'Consultar Coach IA'}</AppButton>
        </form>
        {error ? <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p> : null}
        {answer ? <article className="mt-4 whitespace-pre-wrap rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-700">{answer}</article> : null}
      </SectionCard>
    </div>
  )
}

export default CoachPage
