export function getActivityLoad(activity) {
  const duration = Number(activity?.duration)
  if (!Number.isFinite(duration) || duration <= 0) return 0

  if (activity?.source === 'strava') {
    // Strava aporta volumen objetivo, no RPE ni carga fisiologica.
    return Math.round(duration)
  }

  const rpe = Number(activity?.rpe)
  if (!Number.isFinite(rpe) || rpe < 1 || rpe > 10) return 0
  return Math.round(duration * rpe)
}

export function getActivityLoadLabel(activity) {
  return activity?.source === 'strava' ? 'volumen externo (min)' : 'carga RPE'
}

export function isActivityCompleted(activity) {
  if (activity?.source === 'strava') return activity.planningMatchStatus === 'confirmed'
  return activity?.status !== 'no-realizada'
}
