const SUPPORTED_DISTANCES = [100, 200, 300, 400]

function guessIntensityFromText(text) {
  const lower = text.toLowerCase()

  if (lower.includes('suave')) return 1.06
  if (lower.includes('control')) return 1.02
  if (lower.includes('competicion') || lower.includes('competición')) return 1.0
  if (lower.includes('fuerte')) return 0.97

  return 1.0
}

function extractRecoveryText(text) {
  const recoveryMatch = text.match(/(?:rec|recupera|recuperacion|recuperación|descanso)\s*(\d+)(?::(\d{1,2}))?\s*(s|min|m)?/i)

  if (!recoveryMatch) return ''

  const minutesOrSeconds = Number(recoveryMatch[1])
  const seconds = recoveryMatch[2] ? Number(recoveryMatch[2]) : null
  const unit = recoveryMatch[3]

  if (seconds !== null) return `Recuperación ${minutesOrSeconds}:${String(seconds).padStart(2, '0')}`
  if (unit === 'min' || unit === 'm') return `Recuperación ${minutesOrSeconds} min`
  return `Recuperación ${minutesOrSeconds} s`
}

function normalizeNaturalLanguage(text) {
  return text
    .replace(/(\d+)\s*(series|repeticiones|reps)\s*(de)?\s*(\d{2,4})/gi, '$1x$4')
    .replace(/(\d+)\s*(bloques)\s*(de)?\s*(\d{2,4})/gi, '$1x$4')
    .replace(/metros|metro|m\b/gi, '')
}

export function parseCustomSessionText(rawText) {
  const text = String(rawText ?? '').trim()
  if (!text) {
    return { ok: false, error: 'Escribe una sesión personalizada antes de calcular ritmos.' }
  }

  const normalizedText = normalizeNaturalLanguage(text)
  const regex = /(\d+)\s*[xX]\s*(\d{2,4})/g
  const matches = [...normalizedText.matchAll(regex)]

  if (matches.length === 0) {
    return {
      ok: false,
      error: 'Formato no reconocido. Usa algo como: "6x200 + 3x400 fuerte".',
    }
  }

  const blocks = matches
    .map((match) => ({ repeats: Number(match[1]), distance: Number(match[2]) }))
    .filter((block) => block.repeats > 0 && SUPPORTED_DISTANCES.includes(block.distance))

  if (blocks.length === 0) {
    return {
      ok: false,
      error: 'Solo se admiten bloques con distancias 100, 200, 300 o 400 m.',
    }
  }

  const intensity = guessIntensityFromText(text)
  const recovery = extractRecoveryText(text)

  return {
    ok: true,
    session: {
      id: 'custom-session',
      name: 'Sesión personalizada',
      blocks: blocks.map((block) => ({
        ...block,
        intensity,
        note: recovery ? `Definido por el usuario · ${recovery}` : 'Definido por el usuario',
      })),
      rawText: text,
    },
  }
}
