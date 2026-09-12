import { getResultadoPoliciaLocalMadrid } from './getResultadoPoliciaLocalMadrid'
import { getResultadoPoliciaNacional } from './getResultadoPoliciaNacional'
import { getResultadoGuardiaCivil } from './getResultadoGuardiaCivil'

const resolvers = {
  plm: getResultadoPoliciaLocalMadrid,
  pn: getResultadoPoliciaNacional,
  gc: getResultadoGuardiaCivil,
}

export function getResultadoByBody({ cuerpoId, ...payload }) {
  const resolver = resolvers[cuerpoId]
  if (!resolver) return { ok: false, error: 'Cuerpo no soportado.' }
  return resolver(payload)
}
