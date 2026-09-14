function round2(value) {
  return Math.round(value * 100) / 100
}

export function calculateInterpolatedNote(config, sexo, mark) {
  const pointsTable = config?.porSexo?.[sexo]

  if (!Array.isArray(pointsTable) || pointsTable.length < 2) {
    return { ok: false, error: 'No hay tabla de interpolación válida para este sexo.' }
  }

  const sorted = [...pointsTable].sort((a, b) => a.puntos - b.puntos)
  const lowest = sorted[0]
  const highest = sorted[sorted.length - 1]

  if (config.direccion === 'lowerIsBetter') {
    if (mark <= highest.marca) return { ok: true, nota: highest.puntos }
    if (mark > lowest.marca) return { ok: true, nota: 0 }

    for (let i = 0; i < sorted.length - 1; i += 1) {
      const p1 = sorted[i]
      const p2 = sorted[i + 1]

      if (mark <= p1.marca && mark >= p2.marca) {
        const ratio = (p1.marca - mark) / (p1.marca - p2.marca)
        return { ok: true, nota: round2(p1.puntos + ratio * (p2.puntos - p1.puntos)) }
      }
    }

    return { ok: true, nota: 0 }
  }

  if (mark >= highest.marca) return { ok: true, nota: highest.puntos }
  if (mark < lowest.marca) return { ok: true, nota: 0 }

  for (let i = 0; i < sorted.length - 1; i += 1) {
    const p1 = sorted[i]
    const p2 = sorted[i + 1]

    if (mark >= p1.marca && mark <= p2.marca) {
      const ratio = (mark - p1.marca) / (p2.marca - p1.marca)
      return { ok: true, nota: round2(p1.puntos + ratio * (p2.puntos - p1.puntos)) }
    }
  }

  return { ok: true, nota: 0 }
}

const RANGE_EPSILON = 1e-9

// Las tablas oficiales tienen una precisión limitada (décimas o segundos enteros).
// Una marca con más decimales se redondea a esa precisión a favor del opositor
// para no dejarla caer en huecos entre rangos.
function roundToTablePrecision(mark, config) {
  const step = Number(config?.precision)
  if (!Number.isFinite(step) || step <= 0) return mark
  if (config?.direccion === 'higherIsBetter') return Math.ceil(mark / step - RANGE_EPSILON) * step
  return Math.floor(mark / step + RANGE_EPSILON) * step
}

export function calculateRangeNote(config, sexo, mark) {
  const ranges = config?.porSexo?.[sexo]

  if (!Array.isArray(ranges) || ranges.length === 0) {
    return { ok: false, error: 'No hay tabla de rangos válida para este sexo.' }
  }

  const adjusted = roundToTablePrecision(mark, config)
  const range = ranges.find((item) => adjusted >= item.min - RANGE_EPSILON && adjusted <= item.max + RANGE_EPSILON)
  const nota = range ? Number(itemOrDefault(range.puntos, 0)) : 0
  return { ok: true, nota: round2(nota) }
}

function itemOrDefault(value, fallback) {
  return typeof value === 'number' ? value : fallback
}

export const TRAMOS_EDAD = [
  { id: 'lt35', label: 'Menor de 35 años', min: 0, max: 34 },
  { id: '35-39', label: 'De 35 a 39 años', min: 35, max: 39 },
  { id: 'gt39', label: 'Mayor de 39 años', min: 40, max: 200 },
]

export function getTramoEdad(edad) {
  if (edad === '' || edad == null) return null
  const value = Number(edad)
  if (!Number.isFinite(value)) return null
  return TRAMOS_EDAD.find((tramo) => value >= tramo.min && value <= tramo.max) ?? null
}

export function calculateAptoNoApto(config, sexo, mark, edad) {
  let criteria = config?.porSexo?.[sexo]
  if (!criteria) return { ok: false, error: 'No hay criterio configurado para este sexo.' }

  let tramoLabel = null
  if (criteria.tramos) {
    const tramo = getTramoEdad(edad)
    if (!tramo) return { ok: false, error: 'Indica una edad válida para aplicar el tramo de edad.' }
    const limite = Number(criteria.tramos[tramo.id])
    if (!Number.isFinite(limite)) return { ok: false, error: 'No hay mínimo para tu tramo de edad.' }
    criteria = { marcaLimite: limite }
    tramoLabel = tramo.label
  }

  const esApto = config.direccion === 'lowerIsBetter' ? mark <= criteria.marcaLimite : mark >= criteria.marcaLimite
  return { ok: true, esApto, marcaLimite: criteria.marcaLimite, tramo: tramoLabel }
}
