import { normalizeMark } from './normalizeInput'

export function validateForm({ cuerpoId, sexo, pruebaId, marca, edad, requiereEdad }) {
  if (!cuerpoId) return { ok: false, error: 'Selecciona un cuerpo.' }
  if (!sexo) return { ok: false, error: 'Selecciona el sexo.' }
  if (!pruebaId) return { ok: false, error: 'Selecciona una prueba.' }
  if (!String(marca ?? '').trim()) return { ok: false, error: 'Introduce una marca.' }
  if (requiereEdad) {
    const value = Number(edad)
    if (!Number.isInteger(value) || value < 16 || value > 65) {
      return { ok: false, error: 'Indica una edad válida (16-65).' }
    }
  }
  return { ok: true }
}

export function validateMark(marca, testConfig) {
  const normalized = normalizeMark(marca, testConfig)
  if (!normalized.ok) return normalized
  if (normalized.value === 0) return { ok: false, error: 'La marca debe ser mayor que 0.' }
  return normalized
}
