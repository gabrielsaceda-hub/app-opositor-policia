// Resumen compacto para el Coach IA: variables computadas en cliente en vez
// de volcar el historial crudo. Sin dependencias de Firebase.

function getWeeksToExam(profile) {
  if (profile?.fechaTipo === 'concreta' && profile?.fechaConcreta) {
    const diffMs = new Date(profile.fechaConcreta).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 7)))
  }
  if (profile?.semanasAprox === '' || profile?.semanasAprox == null) return null
  const weeks = Number(profile.semanasAprox)
  return Number.isFinite(weeks) ? weeks : null
}

function getRecentLoad(activities) {
  return (activities ?? []).reduce((sum, activity) => {
    const date = activity.date ? new Date(`${activity.date}T23:59:59`) : null
    const recent = date && !Number.isNaN(date.getTime()) && Date.now() - date.getTime() <= 7 * 24 * 60 * 60 * 1000
    return recent ? sum + (Number(activity.duration) || 0) * (Number(activity.rpe) || 0) : sum
  }, 0)
}

export function buildAthleteSummary({ profile = {}, savedMarks = [], activities = [], wellbeing = [] }) {
  const seen = new Set()
  const notas = []
  for (const mark of savedMarks) {
    if (seen.has(mark.pruebaId) || notas.length >= 12) continue
    seen.add(mark.pruebaId)
    notas.push({
      prueba: mark.pruebaNombre ?? mark.pruebaId,
      marca: mark.marcaMostrada ?? String(mark.marcaNormalizada ?? ''),
      nota: typeof mark.nota === 'number' ? mark.nota : null,
      apto: mark.esApto ?? null,
    })
  }

  const sessions7d = (activities ?? []).filter((activity) => {
    const date = activity.date ? new Date(`${activity.date}T23:59:59`) : null
    return date && !Number.isNaN(date.getTime()) && Date.now() - date.getTime() <= 7 * 24 * 60 * 60 * 1000
  }).length

  const latest = wellbeing?.[0]

  return {
    oposicion: profile.cuerpoObjetivo ?? '',
    sexo: profile.sexo ?? '',
    edad: profile.edad ?? '',
    semanasExamen: getWeeksToExam(profile),
    objetivo: profile.objetivoEntreno ?? '',
    diasEntreno: profile.diasEntreno ?? [],
    notas,
    carga7d: getRecentLoad(activities),
    sesiones7d: sessions7d,
    ultimoBienestar: latest
      ? { suenoHoras: latest.sleepHours ?? '', fatiga: latest.fatigue ?? '', molestias: latest.soreness ?? '' }
      : null,
  }
}
