import { parseTimeInput } from './parseTime'

function parseNumeric(rawValue) {
  const value = Number(String(rawValue ?? '').trim().replace(',', '.'))
  if (!Number.isFinite(value)) return { ok: false, error: 'Introduce un valor numérico válido.' }
  if (value < 0) return { ok: false, error: 'La marca no puede ser negativa.' }
  return { ok: true, value }
}

export function normalizeMark(rawValue, testConfig) {
  if (testConfig.tipoEntrada === 'time') return parseTimeInput(rawValue, testConfig.formatoTiempo)

  if (testConfig.tipoEntrada === 'repetitions') {
    const parsed = parseNumeric(rawValue)
    if (!parsed.ok) return parsed
    if (!Number.isInteger(parsed.value)) {
      return { ok: false, error: 'Las repeticiones deben ser un número entero.' }
    }
    return parsed
  }

  if (testConfig.tipoEntrada === 'suspensionSeconds' || testConfig.tipoEntrada === 'distance') {
    return parseNumeric(rawValue)
  }

  return { ok: false, error: 'Tipo de prueba no soportado.' }
}
