import { getTestsForSelection } from '../../data/tests'
import { getResultadoByBody } from '../calculator/getResultadoByBody'

const defaultDays = ['Lunes', 'Miércoles', 'Viernes']
const WEEK_ORDER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

function getWeeksToExam(profile) {
  if (profile.fechaTipo === 'concreta' && profile.fechaConcreta) {
    const examDate = new Date(profile.fechaConcreta)
    const today = new Date()
    const diffMs = examDate.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0)
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 7)))
  }

  if (profile.semanasAprox === '' || profile.semanasAprox == null) return null
  const weeks = Number(profile.semanasAprox)
  return Number.isFinite(weeks) ? weeks : null
}

function getDaysToExam(profile) {
  if (profile.fechaTipo === 'concreta' && profile.fechaConcreta) {
    const examDate = new Date(profile.fechaConcreta)
    const today = new Date()
    const diffMs = examDate.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0)
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
  }
  if (profile.semanasAprox === '' || profile.semanasAprox == null) return null
  const weeks = Number(profile.semanasAprox)
  return Number.isFinite(weeks) ? Math.max(0, Math.round(weeks * 7)) : null
}

export function formatExamDate(profile) {
  if (profile.fechaTipo === 'concreta' && profile.fechaConcreta) {
    const [y, m, d] = String(profile.fechaConcreta).split('-')
    if (y && m && d) return `${d}/${m}/${y}`
  }
  return ''
}

function getCurrentWeekDates() {
  const now = new Date()
  const currentDay = now.getDay() === 0 ? 6 : now.getDay() - 1
  const monday = new Date(now)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(now.getDate() - currentDay)
  const dates = {}
  WEEK_ORDER.forEach((day, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const dayNum = String(date.getDate()).padStart(2, '0')
    dates[day] = `${year}-${month}-${dayNum}`
  })
  return dates
}

export function getTodayName() {
  return WEEK_ORDER[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]
}

function getPhase(weeksToExam) {
  if (weeksToExam === null) return { name: 'Base inicial', focus: 'crear rutina y registrar marcas de referencia' }
  if (weeksToExam <= 2) return { name: 'Descarga final', focus: 'llegar fresco, mantener chispa y evitar fatiga' }
  if (weeksToExam <= 6) return { name: 'Afinado específico', focus: 'simular pruebas, ritmos oficiales y técnica' }
  if (weeksToExam <= 12) return { name: 'Desarrollo específico', focus: 'mejorar puntos débiles sin descuidar fuerza' }
  return { name: 'Base general', focus: 'construir motor aeróbico, fuerza base y técnica' }
}

function getLatestMark(savedMarks, testId, profile) {
  return savedMarks.find(
    (mark) => mark.pruebaId === testId && mark.cuerpoId === profile.cuerpoObjetivo && mark.sexo === profile.sexo,
  )
}

// Prioridad por puntos perdidos según baremo, no por déficit bruto:
// una prueba con nota 4/10 pierde 6 puntos gane o pierda por poco;
// un apto/no apto no superado equivale a perder los 10 puntos.
function getLostPoints({ cuerpoId, sexo, pruebaId, mark, edad }) {
  const calc = getResultadoByBody({ cuerpoId, sexo, pruebaId, mark, edad })
  if (!calc.ok) return null
  if (calc.tipo === 'puntos' && typeof calc.nota === 'number') return Math.max(0, 10 - calc.nota)
  return calc.esApto ? 0 : 10
}

function getWeaknesses(profile, savedMarks) {
  const tests = getTestsForSelection(profile.cuerpoObjetivo, profile.sexo)

  return tests
    .map((test) => {
      const latest = getLatestMark(savedMarks, test.id, profile)
      const note = typeof latest?.nota === 'number' ? latest.nota : null
      let lost = null
      if (latest && typeof latest.marcaNormalizada === 'number') {
        lost = getLostPoints({
          cuerpoId: profile.cuerpoObjetivo,
          sexo: profile.sexo,
          pruebaId: test.id,
          mark: latest.marcaNormalizada,
          edad: Number(profile.edad),
        })
      }
      // Sin marca: máxima prioridad. Con marca pero sin baremo: prioridad media.
      const priority = !latest ? 11 : lost === null ? (note === null ? 5 : Math.max(1, 10 - note)) : Math.max(0.5, lost)

      return {
        test,
        latest,
        priority,
        note,
        lost,
      }
    })
    .sort((a, b) => b.priority - a.priority)
}

function getSessionForTest(testName, context) {
  const lowerName = testName.toLowerCase()
  const duration = Number(context.profile.duracionSesion) || 60
  const short = duration <= 45
  const hasGym = Boolean(context.profile.material?.gimnasio)
  const hasPool = Boolean(context.profile.material?.piscina)

  if (lowerName.includes('800') || lowerName.includes('1000')) {
    return {
      title: `Carrera específica ${testName}`,
      blocks: [
        'Calentamiento 12-15 min suave + movilidad de tobillo/cadera + 4 progresivos.',
        short ? 'Bloque principal: 6 x 200 m a ritmo controlado, rec 90 s.' : 'Bloque principal: 5 x 300 m o 4 x 400 m a ritmo objetivo, rec 2-3 min.',
        'Vuelta a la calma 8-10 min + estiramientos suaves.',
      ],
    }
  }

  if (lowerName.includes('60')) {
    return {
      title: `Velocidad y salida ${testName}`,
      blocks: [
        'Calentamiento completo 15 min + técnica de carrera.',
        '6 salidas de 10-20 m buscando reacción y postura.',
        '4-6 aceleraciones de 40-60 m con recuperación completa.',
      ],
    }
  }

  if (lowerName.includes('circuito') || lowerName.includes('agilidad')) {
    return {
      title: 'Agilidad y cambios de dirección',
      blocks: [
        'Movilidad + activación de glúteo, tobillo y core.',
        'Técnica: 8-10 repeticiones submáximas del circuito o conos.',
        'Bloque calidad: 4-6 intentos cronometrados con descanso amplio.',
      ],
    }
  }

  if (lowerName.includes('dominadas') || lowerName.includes('flexiones') || lowerName.includes('suspensión')) {
    return {
      title: `Fuerza específica ${testName}`,
      blocks: [
        'Activación escapular + movilidad hombro 10 min.',
        hasGym ? 'Fuerza: jalón/remo + empuje + core, 3-4 series controladas.' : 'Fuerza: progresiones con barra/suelo, 4-6 series sin llegar al fallo.',
        'Final específico: 2-3 series técnicas dejando 2 repeticiones en recámara.',
      ],
    }
  }

  if (lowerName.includes('natación')) {
    return {
      title: hasPool ? 'Natación técnica y velocidad' : 'Preparación fuera del agua para natación',
      blocks: hasPool
        ? ['Calentamiento 200 m suave.', '8 x 25 m técnica/velocidad, rec 45-60 s.', '100-200 m suaves para soltar.']
        : ['Movilidad hombro/torácica.', 'Core + gomas de hombro.', 'Busca al menos 1 sesión semanal en piscina si la prueba cuenta.'],
    }
  }

  return {
    title: `Técnica específica ${testName}`,
    blocks: [
      'Calentamiento general + movilidad.',
      'Técnica de la prueba con volumen moderado.',
      'Trabajo complementario de fuerza y estabilidad.',
    ],
  }
}

function buildWeeklyPlan(profile, weaknesses, phase) {
  const days = profile.diasEntreno?.length ? profile.diasEntreno : defaultDays
  const hasInjury = Boolean(profile.lesiones?.trim())

  return days.map((day, index) => {
    const selected = weaknesses[index % Math.max(weaknesses.length, 1)]
    const session = selected
      ? getSessionForTest(selected.test.nombre, { profile, phase })
      : {
          title: 'Sesión general',
          blocks: ['Rodaje suave 25-35 min.', 'Fuerza general 25 min.', 'Movilidad 10 min.'],
        }

    const load = hasInjury && index === 0 ? 'moderada, sin dolor' : index % 3 === 2 ? 'suave/técnica' : 'calidad controlada'

    return {
      day,
      load,
      ...session,
    }
  })
}

function getRecentLoad(activities) {
  return (activities ?? []).reduce((sum, activity) => {
    const date = activity.date ? new Date(`${activity.date}T23:59:59`) : null
    const recent = date && !Number.isNaN(date.getTime()) && Date.now() - date.getTime() <= 7 * 24 * 60 * 60 * 1000
    return recent ? sum + (Number(activity.duration) || 0) * (Number(activity.rpe) || 0) : sum
  }, 0)
}

function getSleepAverage(wellbeing) {
  const values = (wellbeing ?? []).slice(0, 7).map((entry) => Number(entry.sleepHours)).filter((value) => Number.isFinite(value))
  if (!values.length) return null
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10
}

function getRecoveryStatus(activities, wellbeing) {
  const latest = wellbeing?.[0]
  const sleepHours = Number(latest?.sleepHours)
  const fatigue = Number(latest?.fatigue)
  const soreness = Number(latest?.soreness)
  const lowRecovery = (Number.isFinite(sleepHours) && sleepHours < 6) || fatigue >= 8 || soreness >= 8
  const recentLoad = getRecentLoad(activities)
  const sleepAvg = getSleepAverage(wellbeing)
  const detail = `Sueño: ${Number.isFinite(sleepHours) ? `${sleepHours} h` : '—'} (media 7d: ${sleepAvg ?? '—'} h) · Fatiga: ${Number.isFinite(fatigue) ? `${fatigue}/10` : '—'} · Carga 7d: ${recentLoad}.`

  if (lowRecovery) {
    return {
      level: 'alta',
      recentLoad,
      message: `Recuperación baja registrada. ${detail} Prioriza técnica, movilidad y descanso. No fuerces máximos.`,
    }
  }

  if (recentLoad >= 1800) {
    return {
      level: 'moderada',
      recentLoad,
      message: `Carga reciente elevada. ${detail} Alterna sesiones de calidad con recuperación.`,
    }
  }

  return { level: 'normal', recentLoad, message: `Sin señales de recuperación baja. ${detail}` }
}

function getNutrition(profile) {
  const weight = Number(profile.peso)
  const heightM = Number(profile.altura) / 100
  const bmi = Number.isFinite(weight) && Number.isFinite(heightM) && heightM > 0 ? weight / (heightM * heightM) : null
  const proteinLow = Number.isFinite(weight) ? Math.round(weight * 1.6) : null
  const proteinHigh = Number.isFinite(weight) ? Math.round(weight * 2) : null

  return {
    bmi,
    tips: [
      proteinLow ? `Proteína orientativa: ${proteinLow}-${proteinHigh} g/día repartidos en 3-5 tomas.` : 'Añade peso para estimar proteína diaria.',
      'Antes de series o fuerza intensa: comida con hidratos 2-3 h antes y agua suficiente.',
      'Después de entrenar: combina proteína + hidratos para recuperar mejor.',
      'En semanas de mucha carrera, no recortes hidratos de forma agresiva: perjudica ritmos y recuperación.',
      'Evita cambios bruscos de dieta en las 2 semanas previas al examen.',
    ],
    caution: 'Orientación deportiva general. Si hay patologías, alergias, medicación o trastornos alimentarios, consulta a un profesional sanitario.',
  }
}

// Nivel de preparación: foto honesta y explicable, sin probabilidades.
// Cada factor muestra su estado; el nivel solo agrega lo medido.
export function buildReadiness({ profile, weaknesses, progress, daysToExam, recovery, activities = [], wellbeing = [] }) {
  const tests = getTestsForSelection(profile?.cuerpoObjetivo, profile?.sexo)
  const withMarks = (weaknesses ?? []).filter((item) => item.latest)
  const factors = []

  if (!tests.length) {
    factors.push({ id: 'marcas', label: 'Marcas registradas', status: 'nodata', detail: 'Completa sexo y cuerpo objetivo en Perfil.' })
  } else if (!withMarks.length) {
    factors.push({ id: 'marcas', label: 'Marcas registradas', status: 'nodata', detail: 'Sin marcas todavía. Registra al menos una para valorar.' })
  } else {
    const avgLost = withMarks.reduce((sum, item) => sum + (typeof item.lost === 'number' ? item.lost : 5), 0) / withMarks.length
    factors.push({
      id: 'marcas',
      label: 'Marcas registradas',
      status: avgLost > 6 ? 'malo' : avgLost > 3 ? 'regular' : 'bueno',
      detail: `${withMarks.length}/${tests.length} pruebas con marca · pérdida media ~${(Math.round(avgLost * 10) / 10).toFixed(1)} puntos.`,
    })
  }

  if (!progress || !progress.planned) {
    factors.push({ id: 'adherencia', label: 'Adherencia semanal', status: 'nodata', detail: 'Sin sesiones planificadas esta semana.' })
  } else {
    factors.push({
      id: 'adherencia',
      label: 'Adherencia semanal',
      status: progress.percent >= 80 ? 'bueno' : progress.percent >= 50 ? 'regular' : 'malo',
      detail: `${progress.completed}/${progress.planned} sesiones (${progress.percent}%).`,
    })
  }

  factors.push({
    id: 'fecha',
    label: 'Fecha de examen',
    status: 'info',
    detail: daysToExam === null ? 'Sin fecha definida.' : `Faltan ${daysToExam} días.`,
  })

  const worst = (weaknesses ?? [])[0]
  if (!worst || !worst.latest || typeof worst.lost !== 'number') {
    factors.push({ id: 'limitante', label: 'Prueba limitante', status: 'nodata', detail: 'Sin marcas para detectar la limitante.' })
  } else {
    factors.push({
      id: 'limitante',
      label: 'Prueba limitante',
      status: worst.lost > 6 ? 'malo' : worst.lost > 3 ? 'regular' : 'bueno',
      detail: `${worst.test.nombre}: pierdes ~${(Math.round(worst.lost * 10) / 10).toFixed(1)} puntos.`,
    })
  }

  if (!(activities ?? []).length && !(wellbeing ?? []).length) {
    factors.push({ id: 'carga', label: 'Carga y recuperación', status: 'nodata', detail: 'Sin registros de carga ni sueño.' })
  } else {
    factors.push({
      id: 'carga',
      label: 'Carga y recuperación',
      status: recovery.level === 'alta' ? 'malo' : recovery.level === 'moderada' ? 'regular' : 'bueno',
      detail: recovery.message,
    })
  }

  const scored = factors.filter((item) => item.status === 'bueno' || item.status === 'regular' || item.status === 'malo')
  let level = 'Sin datos'
  if (scored.length >= 2 && withMarks.length > 0) {
    const malos = scored.filter((item) => item.status === 'malo').length
    const regulares = scored.filter((item) => item.status === 'regular').length
    if (malos >= 2) level = 'Frágil'
    else if (malos === 1 || regulares >= 2) level = 'En camino'
    else level = 'Sólida'
  }

  return { level, factors }
}

export function buildTrainingPlan({ profile, savedMarks, activities = [], wellbeing = [] }) {
  if (!profile?.cuerpoObjetivo || !profile?.sexo) {
    return { ok: false, error: 'Completa sexo y cuerpo objetivo en Perfil para generar entrenamiento.' }
  }

  const weeksToExam = getWeeksToExam(profile)
  const daysToExam = getDaysToExam(profile)
  const examDateLabel = formatExamDate(profile)
  const phase = getPhase(weeksToExam)
  const weaknesses = getWeaknesses(profile, savedMarks)
  const mainWeakness = weaknesses[0]
  const recovery = getRecoveryStatus(activities, wellbeing)
  const weeklyPlan = buildWeeklyPlan(profile, weaknesses, phase)
  const today = mainWeakness
    ? getSessionForTest(mainWeakness.test.nombre, { profile, phase })
    : getSessionForTest('resistencia general', { profile, phase })

  const adjustedToday = recovery.level === 'alta'
    ? {
        ...today,
        title: `${today.title} · recuperación`,
        blocks: today.blocks.map((block, index) => index === 1 ? `${block} Reduce el volumen y mantén RPE bajo.` : block),
      }
    : today

  const weekDates = getCurrentWeekDates()
  const todayName = getTodayName()
  const doneDays = new Set(
    (activities ?? [])
      .filter((activity) => activity.date && activity.status !== 'no-realizada')
      .map((activity) => activity.date),
  )
  const progress = {
    planned: weeklyPlan.length,
    completed: weeklyPlan.filter((session) => doneDays.has(weekDates[session.day])).length,
    percent: weeklyPlan.length ? Math.round((weeklyPlan.filter((session) => doneDays.has(weekDates[session.day])).length / weeklyPlan.length) * 100) : 0,
  }
  const orderIndex = WEEK_ORDER.indexOf(todayName)
  const nextSession = weeklyPlan.find((session) => WEEK_ORDER.indexOf(session.day) > orderIndex) ?? null

  const readiness = buildReadiness({ profile, weaknesses, progress, daysToExam, recovery, activities, wellbeing })

  return {
    ok: true,
    weeksToExam,
    daysToExam,
    examDateLabel,
    readiness,
    phase,
    mainPriority: mainWeakness
      ? (typeof mainWeakness.lost === 'number'
        ? `${mainWeakness.test.nombre}: pierdes ~${Math.round(mainWeakness.lost * 10) / 10} puntos según baremo.`
        : `${mainWeakness.test.nombre}: ${mainWeakness.latest ? `última nota ${mainWeakness.note?.toFixed?.(2) ?? 'sin nota'}` : 'sin marca registrada'}.`)
      : 'Registra marcas para priorizar mejor.',
    today: { ...adjustedToday, day: todayName, date: weekDates[todayName] },
    tomorrow: nextSession ? { ...nextSession, date: weekDates[nextSession.day] } : null,
    progress,
    weeklyPlan,
    nutrition: getNutrition(profile),
    recovery,
    safetyNotes: [
      'No hagas dos sesiones máximas seguidas de la misma cualidad.',
      'Si hay dolor articular o muscular creciente, cambia por técnica suave o descanso.',
      'Repite test de control cada 10-14 días, no cada día.',
    ],
  }
}
