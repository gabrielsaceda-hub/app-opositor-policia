import { normalizeMark } from '../../utils/normalizeInput'

export function getEightHundredSeconds(rawMark) {
  const parsed = normalizeMark(rawMark, {
    tipoEntrada: 'time',
    formatoTiempo: 'minutesSeconds',
  })

  if (!parsed.ok) return parsed

  if (parsed.value < 80 || parsed.value > 480) {
    return {
      ok: false,
      error: 'La marca de 800 m parece fuera de rango. Revisa el formato (ej: 2:25).',
    }
  }

  return { ok: true, value: parsed.value }
}

export function getBasePacesByDistance(eightHundredSeconds) {
  const pacePer100 = eightHundredSeconds / 8

  return {
    100: pacePer100,
    200: pacePer100 * 2,
    300: pacePer100 * 3,
    400: pacePer100 * 4,
  }
}
