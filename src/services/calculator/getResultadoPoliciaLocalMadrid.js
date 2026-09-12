import { policiaLocalMadridBaremos } from '../../data/baremos/policiaLocalMadrid'
import { calculateInterpolatedNote } from './helpers'

export function getResultadoPoliciaLocalMadrid({ pruebaId, sexo, mark }) {
  const baremo = policiaLocalMadridBaremos[pruebaId]
  if (!baremo) return { ok: false, error: 'No hay baremo para esta prueba de Policía Local de Madrid.' }

  const note = calculateInterpolatedNote(baremo, sexo, mark)
  if (!note.ok) return note

  return {
    ok: true,
    tipo: 'puntos',
    nota: note.nota,
    esApto: note.nota > 0,
    observacion: note.nota > 0 ? `Tu resultado equivale a ${note.nota.toFixed(2)} puntos.` : 'No alcanzas la marca mínima.',
  }
}
