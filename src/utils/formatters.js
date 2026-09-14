export function formatSecondsAsMinSec(totalSeconds) {
  const centiseconds = Math.round(Number(totalSeconds) * 100)
  const min = Math.floor(centiseconds / 6000)
  const rest = centiseconds - min * 6000
  const sec = Math.floor(rest / 100)
  const cs = rest - sec * 100
  const secText = String(sec).padStart(2, '0')
  if (cs === 0) return `${min}:${secText}`
  return `${min}:${secText}.${String(cs).padStart(2, '0')}`
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
