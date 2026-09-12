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

export function calculateRangeNote(config, sexo, mark) {
  const ranges = config?.porSexo?.[sexo]

  if (!Array.isArray(ranges) || ranges.length === 0) {
    return { ok: false, error: 'No hay tabla de rangos válida para este sexo.' }
  }

  const range = ranges.find((item) => mark >= item.min && mark <= item.max)
  const nota = range ? Number(itemOrDefault(range.puntos, 0)) : 0
  return { ok: true, nota: round2(nota) }
}

function itemOrDefault(value, fallback) {
  return typeof value === 'number' ? value : fallback
}

export function calculateAptoNoApto(config, sexo, mark) {
  const criteria = config?.porSexo?.[sexo]
  if (!criteria) return { ok: false, error: 'No hay criterio configurado para este sexo.' }

  const esApto = config.direccion === 'lowerIsBetter' ? mark <= criteria.marcaLimite : mark >= criteria.marcaLimite
  return { ok: true, esApto }
}
