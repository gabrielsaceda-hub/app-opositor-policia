import { guardiaCivilBaremos } from '../../data/baremos/guardiaCivil'
import { getTestById } from '../../data/tests/index'
import { formatNormalizedMarkByTest } from '../../utils/formatters'
import { calculateAptoNoApto } from './helpers'

export function getResultadoGuardiaCivil({ pruebaId, sexo, mark, edad }) {
  const baremo = guardiaCivilBaremos[pruebaId]
  if (!baremo) return { ok: false, error: 'No hay baremo para esta prueba de Guardia Civil.' }

  const result = calculateAptoNoApto(baremo, sexo, mark, edad)
  if (!result.ok) return result

  const limite = formatNormalizedMarkByTest(result.marcaLimite, getTestById(pruebaId))
  const tramo = result.tramo ? ` (${result.tramo})` : ''
  return {
    ok: true,
    tipo: 'aptoNoApto',
    esApto: result.esApto,
    observacion: result.esApto
      ? `Cumples el mínimo${tramo}: ${limite}.`
      : `No alcanzas el mínimo${tramo}: ${limite}.`,
  }
}
