import { policiaNacionalBaremos } from '../../data/baremos/policiaNacional'
import { calculateRangeNote } from './helpers'

export function getResultadoPoliciaNacional({ pruebaId, sexo, mark }) {
  const baremo = policiaNacionalBaremos[pruebaId]
  if (!baremo) return { ok: false, error: 'No hay baremo para esta prueba de Policía Nacional.' }

  const note = calculateRangeNote(baremo, sexo, mark)
  if (!note.ok) return note

  return {
    ok: true,
    tipo: 'puntos',
    nota: note.nota,
    esApto: note.nota > 0,
    observacion: note.nota > 0 ? `Tu resultado equivale a ${note.nota.toFixed(2)} puntos.` : 'No alcanzas la marca mínima.',
  }
}
