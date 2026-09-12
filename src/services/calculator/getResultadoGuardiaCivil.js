import { guardiaCivilBaremos } from '../../data/baremos/guardiaCivil'
import { calculateAptoNoApto } from './helpers'

export function getResultadoGuardiaCivil({ pruebaId, sexo, mark }) {
  const baremo = guardiaCivilBaremos[pruebaId]
  if (!baremo) return { ok: false, error: 'No hay baremo para esta prueba de Guardia Civil.' }

  const result = calculateAptoNoApto(baremo, sexo, mark)
  if (!result.ok) return result

  return {
    ok: true,
    tipo: 'aptoNoApto',
    esApto: result.esApto,
    observacion: result.esApto ? 'Cumples el mínimo exigido.' : 'No alcanzas la marca mínima.',
  }
}
