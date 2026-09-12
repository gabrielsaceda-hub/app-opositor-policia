import { seasonPhases } from '../../data/rhythm/seasonPhases'

export function getWeeksToExam(examDate) {
  if (!examDate) return null

  const exam = new Date(examDate)
  if (Number.isNaN(exam.getTime())) return null

  const now = new Date()
  const diffMs = exam.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  return Math.max(0, Math.ceil(diffDays / 7))
}

export function getSeasonPhaseByWeeks(weeksRemaining) {
  if (weeksRemaining === null || weeksRemaining === undefined) return null

  return seasonPhases.find((phase) => weeksRemaining >= phase.minWeeks) ?? seasonPhases.at(-1)
}

export function getWeekIntensityFactor(weeksRemaining, phaseId) {
  if (weeksRemaining === null || weeksRemaining === undefined) return 1

  if (phaseId === 'base-general') {
    if (weeksRemaining > 20) return 1.05
    return 1.03
  }

  if (phaseId === 'desarrollo-especifico') {
    if (weeksRemaining > 10) return 1.02
    return 1.0
  }

  if (phaseId === 'afinado-competitivo') {
    if (weeksRemaining > 4) return 0.99
    return 0.98
  }

  return 0.96
}
