import { getTestsForSelection } from '../../data/tests'

const defaultDays = ['Lunes', 'Miércoles', 'Viernes']

function getWeeksToExam(profile) {
  if (profile.fechaTipo === 'concreta' && profile.fechaConcreta) {
    const examDate = new Date(profile.fechaConcreta)
    const today = new Date()
    const diffMs = examDate.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0)
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 7)))
  }

  const weeks = Number(profile.semanasAprox)
  return Number.isFinite(weeks) ? weeks : null
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

function getWeaknesses(profile, savedMarks) {
  const tests = getTestsForSelection(profile.cuerpoObjetivo, profile.sexo)

  return tests
    .map((test) => {
      const latest = getLatestMark(savedMarks, test.id, profile)
      const note = typeof latest?.nota === 'number' ? latest.nota : null
      const priority = latest ? (note === null ? 5 : Math.max(1, 10 - note)) : 11

      return {
        test,
        latest,
        priority,
        note,
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

export function buildTrainingPlan({ profile, savedMarks }) {
  if (!profile?.cuerpoObjetivo || !profile?.sexo) {
    return { ok: false, error: 'Completa sexo y cuerpo objetivo en Perfil para generar entrenamiento.' }
  }

  const weeksToExam = getWeeksToExam(profile)
  const phase = getPhase(weeksToExam)
  const weaknesses = getWeaknesses(profile, savedMarks)
  const mainWeakness = weaknesses[0]
  const today = mainWeakness
    ? getSessionForTest(mainWeakness.test.nombre, { profile, phase })
    : getSessionForTest('resistencia general', { profile, phase })

  return {
    ok: true,
    weeksToExam,
    phase,
    mainPriority: mainWeakness
      ? `${mainWeakness.test.nombre}: ${mainWeakness.latest ? `última nota ${mainWeakness.note?.toFixed?.(2) ?? 'sin nota'}` : 'sin marca registrada'}.`
      : 'Registra marcas para priorizar mejor.',
    today,
    weeklyPlan: buildWeeklyPlan(profile, weaknesses, phase),
    nutrition: getNutrition(profile),
    safetyNotes: [
      'No hagas dos sesiones máximas seguidas de la misma cualidad.',
      'Si hay dolor articular o muscular creciente, cambia por técnica suave o descanso.',
      'Repite test de control cada 10-14 días, no cada día.',
    ],
  }
}
