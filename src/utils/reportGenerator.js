import { getTestsForSelection } from '../data/tests'
import { normalizeMark } from './normalizeInput'

function getWeeksToExam(profile) {
  if (profile.fechaTipo === 'concreta' && profile.fechaConcreta) {
    const examDate = new Date(profile.fechaConcreta)
    const now = new Date()
    const diffMs = examDate.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0)
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    return Math.max(0, Math.ceil(diffDays / 7))
  }

  const weeks = Number(profile.semanasAprox)
  return Number.isFinite(weeks) && weeks >= 0 ? weeks : null
}

function getFrequencyPlan(weeksToExam) {
  if (weeksToExam === null) {
    return 'Empieza con 3 sesiones/semana y reajusta cuando definas fecha de prueba.'
  }

  if (weeksToExam <= 4) return '4-5 sesiones/semana con enfoque específico en las pruebas oficiales.'
  if (weeksToExam <= 8) return '4 sesiones/semana: 2 calidad + 1 fuerza + 1 técnica.'
  if (weeksToExam <= 16) return '3-4 sesiones/semana priorizando base aeróbica y técnica.'
  return '3 sesiones/semana para construir base y prevenir lesiones.'
}

function getLatestMark(savedMarks, cuerpoId, sexo, pruebaId) {
  return savedMarks.find(
    (entry) => entry.cuerpoId === cuerpoId && entry.sexo === sexo && entry.pruebaId === pruebaId,
  )
}

function getProgress(test, currentMark, targetMark) {
  if (test.direccion === 'lowerIsBetter') {
    const delta = currentMark - targetMark
    if (delta <= 0) {
      return {
        deficit: 0,
        comment: 'Objetivo ya alcanzado. Mantén ritmo y afina técnica.',
      }
    }
    return {
      deficit: delta,
      comment: `Debes mejorar ${delta.toFixed(2)} para llegar al objetivo.`,
    }
  }

  const delta = targetMark - currentMark
  if (delta <= 0) {
    return {
      deficit: 0,
      comment: 'Objetivo ya alcanzado. Mantén fuerza y consistencia.',
    }
  }
  return {
    deficit: delta,
    comment: `Debes mejorar ${delta.toFixed(2)} para llegar al objetivo.`,
  }
}

export function generateTrainingReport({ profile, savedMarks }) {
  if (!profile?.cuerpoObjetivo || !profile?.sexo) {
    return {
      ok: false,
      error: 'Para generar informe debes indicar cuerpo objetivo y sexo en el perfil.',
    }
  }

  const tests = getTestsForSelection(profile.cuerpoObjetivo, profile.sexo)
  if (tests.length === 0) {
    return { ok: false, error: 'No hay pruebas disponibles para el cuerpo y sexo seleccionados.' }
  }

  const weeksToExam = getWeeksToExam(profile)
  const frequency = getFrequencyPlan(weeksToExam)

  const testAnalysis = tests.map((test) => {
    const targetRaw = profile.objetivos?.[test.id]
    const latest = getLatestMark(savedMarks, profile.cuerpoObjetivo, profile.sexo, test.id)

    const targetParsed = targetRaw ? normalizeMark(targetRaw, test) : null
    const hasValidTarget = targetParsed?.ok

    if (!hasValidTarget) {
      return {
        testName: test.nombre,
        status: 'sin_objetivo',
        priority: 2,
        deficit: null,
        recommendation: 'Define una marca objetivo válida para esta prueba.',
      }
    }

    if (!latest) {
      return {
        testName: test.nombre,
        status: 'sin_marca_actual',
        priority: 3,
        deficit: null,
        recommendation: 'No tienes marca reciente. Haz una toma de referencia esta semana.',
      }
    }

    const progress = getProgress(test, latest.marcaNormalizada, targetParsed.value)

    return {
      testName: test.nombre,
      status: 'con_marca',
      priority: progress.deficit > 0 ? 4 : 1,
      deficit: progress.deficit,
      recommendation: progress.comment,
    }
  }).sort((a, b) => b.priority - a.priority || (b.deficit ?? 0) - (a.deficit ?? 0))

  const mainPriority = testAnalysis.find((item) => item.priority >= 3)

  const generalTips = [
    'Incluye movilidad y activación antes de cada sesión (10-15 min).',
    'Haz al menos 1 sesión semanal específica por prueba prioritaria.',
    'Registra marcas cada 1-2 semanas para ajustar cargas.',
    'Programa 1 día de descanso total y 1 día de trabajo suave.',
  ]

  return {
    ok: true,
    weeksToExam,
    frequency,
    testAnalysis,
    mainPriority: mainPriority
      ? `Prioridad principal: ${mainPriority.testName}. ${mainPriority.recommendation}`
      : 'Todas las pruebas con objetivo están controladas. Mantén consistencia y técnica.',
    generalTips,
  }
}
