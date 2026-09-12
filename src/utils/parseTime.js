export function parseTimeInput(rawValue, formatHint) {
  const value = String(rawValue ?? '').trim().replace(',', '.')

  if (!value) return { ok: false, error: 'Debes introducir una marca.' }

  if (value.includes(':')) {
    const [m, s] = value.split(':')
    const minutes = Number(m)
    const seconds = Number(s)

    if (!Number.isFinite(minutes) || !Number.isFinite(seconds) || minutes < 0 || seconds < 0) {
      return { ok: false, error: 'Formato de tiempo no válido.' }
    }

    if (seconds >= 60) {
      return { ok: false, error: 'Tiempo imposible: los segundos no pueden ser 60 o más.' }
    }

    return { ok: true, value: minutes * 60 + seconds }
  }

  if (formatHint === 'minutesSeconds' && value.includes('.')) {
    const [m, s] = value.split('.')
    if (s?.length === 2) {
      const minutes = Number(m)
      const seconds = Number(s)
      if (Number.isFinite(minutes) && Number.isFinite(seconds) && seconds < 60 && minutes >= 0 && seconds >= 0) {
        return { ok: true, value: minutes * 60 + seconds }
      }
    }
  }

  if (formatHint === 'minutesSeconds') {
    return {
      ok: false,
      error: 'Para esta prueba introduce el tiempo en formato minutos:segundos. Ejemplo: 2:00 o 2.00.',
    }
  }

  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return { ok: false, error: 'Introduce un tiempo numérico válido.' }
  if (numeric < 0) return { ok: false, error: 'La marca no puede ser negativa.' }

  return { ok: true, value: numeric }
}
