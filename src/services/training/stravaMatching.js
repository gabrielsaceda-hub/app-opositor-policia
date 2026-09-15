const RUN_SPORTS = ['run', 'trailrun', 'virtualrun', 'walk', 'hike']
const SWIM_SPORTS = ['swim', 'virtualswim']
const STRENGTH_SPORTS = ['weighttraining', 'workout', 'crossfit']

function normalizedSport(activity) {
  return String(activity?.sport ?? '').toLowerCase().replace(/[^a-z]/g, '')
}

function isCompatible(activity, planned) {
  const sport = normalizedSport(activity)
  const title = String(planned?.title ?? '').toLowerCase()
  if (RUN_SPORTS.some((item) => sport.includes(item))) {
    return /carrera|rodaje|velocidad|resistencia|ritmo|prueba/.test(title)
  }
  if (SWIM_SPORTS.some((item) => sport.includes(item))) return title.includes('natación')
  if (STRENGTH_SPORTS.some((item) => sport.includes(item))) return title.includes('fuerza')
  return false
}

export function getStravaMatchCandidates({ activity, plannedWeek, plannedDuration }) {
  if (activity?.source !== 'strava' || activity?.planningMatchStatus === 'confirmed' || activity?.planningMatchStatus === 'rejected') return []
  if (!activity?.date || !Number.isFinite(Number(activity.duration)) || Number(activity.duration) <= 0) return []

  const expected = Number(plannedDuration)
  if (!Number.isFinite(expected) || expected <= 0) return []

  return (plannedWeek ?? []).filter((item) => {
    if (item.date !== activity.date || !item.planned) return false
    if (!isCompatible(activity, item.planned)) return false
    if (Number(activity.duration) < expected * 0.5 || Number(activity.duration) > expected * 1.5) return false
    return !(item.activities ?? []).some((entry) => entry.source !== 'strava' || entry.planningMatchStatus === 'confirmed')
  })
}
