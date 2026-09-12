export function formatSecondsAsMinSec(totalSeconds) {
  const min = Math.floor(totalSeconds / 60)
  const sec = totalSeconds - min * 60
  const secText = sec.toFixed(2).replace(/\.00$/, '').padStart(2, '0')
  return `${min}:${secText}`
}

export function formatMarkDisplay(raw, normalized, testConfig) {
  if (testConfig.tipoEntrada === 'time') {
    return `${raw} (${formatSecondsAsMinSec(normalized)})`
  }

  if (testConfig.tipoEntrada === 'distance') {
    return `${normalized.toFixed(2)} m`
  }

  if (testConfig.tipoEntrada === 'suspensionSeconds') {
    return `${normalized.toFixed(2)} s`
  }

  return `${normalized}`
}

export function formatNota(nota) {
  return Number(nota).toFixed(2)
}

export function formatResultado(result) {
  return result.tipo === 'puntos' ? `${formatNota(result.nota)} puntos` : result.esApto ? 'Apto' : 'No apto'
}

export function formatNormalizedMarkByTest(value, testConfig) {
  if (!testConfig) return `${Number(value).toFixed(2)}`

  if (testConfig.tipoEntrada === 'time') {
    if (testConfig.formatoTiempo === 'minutesSeconds') return formatSecondsAsMinSec(value)
    return `${Number(value).toFixed(2)} s`
  }

  if (testConfig.tipoEntrada === 'distance') return `${Number(value).toFixed(2)} m`
  if (testConfig.tipoEntrada === 'suspensionSeconds') return `${Number(value).toFixed(2)} s`
  if (testConfig.tipoEntrada === 'repetitions') return `${Math.round(Number(value))} rep`

  return `${Number(value).toFixed(2)}`
}
