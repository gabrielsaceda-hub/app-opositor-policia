import { allSessionTemplates, sessionTemplatesByPhase } from '../../data/rhythm/sessionTemplates'

function getBlockTargetTime(basePaceByDistance, block, intensityFactor = 1) {
  const distance = block.distance
  const baseSplit = basePaceByDistance[distance]
  if (!baseSplit) return null

  return baseSplit * block.intensity * intensityFactor
}

export function getSuggestedSessionForToday(phaseId) {
  const sessions = sessionTemplatesByPhase[phaseId] ?? []
  if (sessions.length === 0) return null

  const day = new Date().getDay()
  return sessions[day % sessions.length]
}

export function getSessionById(sessionId) {
  return allSessionTemplates.find((session) => session.id === sessionId) ?? null
}

export function getSessionsForPhase(phaseId) {
  return sessionTemplatesByPhase[phaseId] ?? []
}

export function buildSessionPaces(session, basePaceByDistance, intensityFactor = 1) {
  if (!session) return []

  return session.blocks.map((block) => ({
    ...block,
    targetTime: getBlockTargetTime(basePaceByDistance, block, intensityFactor),
  }))
}
