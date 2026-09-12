// Modal con perfil completo + resumen de entrenamientos del socio.
import { useEffect, useState } from 'react'
import { getUserMarksOnce } from '../../services/admin/adminService'

function UserDetailModal({ user, onClose }) {
  const [marks, setMarks] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true
    getUserMarksOnce(user.uid)
      .then((items) => { if (active) setMarks(items) })
      .catch(() => {})
      .finally(() => { if (active) setIsLoading(false) })
    return () => { active = false }
  }, [user.uid])

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-900/50 p-3 sm:items-center sm:justify-center">
      <div className="max-h-[90svh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-brand-900">{user.nombre || '(sin nombre)'}</h2>
            <p className="text-sm text-slate-600">{user.email || 'sin email'} · {user.uid}</p>
          </div>
          <button type="button" className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold" onClick={onClose}>Cerrar</button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-700">
          <p className="rounded-xl bg-slate-50 p-2">Rol: <strong>{user.role}</strong></p>
          <p className="rounded-xl bg-slate-50 p-2">Estado: <strong>{user.status}</strong></p>
          <p className="rounded-xl bg-slate-50 p-2">Plan: <strong>{user.plan}</strong></p>
          <p className="rounded-xl bg-slate-50 p-2">Strava: <strong>{user.stravaConnected ? 'Sí' : 'No'}</strong></p>
          <p className="rounded-xl bg-slate-50 p-2">Cuerpo: <strong>{user.cuerpoObjetivo || '—'}</strong></p>
          <p className="rounded-xl bg-slate-50 p-2">Peso/Altura: <strong>{user.peso || '—'} / {user.altura || '—'}</strong></p>
        </div>
        <h3 className="mt-4 font-extrabold text-brand-900">Entrenamientos ({marks.length})</h3>
        {isLoading ? <p className="text-sm text-slate-500">Cargando…</p> : null}
        <div className="mt-2 space-y-2">
          {marks.map((m) => (
            <p key={m.id} className="rounded-xl bg-slate-50 p-2 text-sm text-slate-700">
              <strong>{m.pruebaNombre ?? m.sport ?? 'Actividad'}</strong> · {m.marcaMostrada ?? `${m.duration ?? '?'} min`} · {new Date(m.fecha).toLocaleDateString('es-ES')}
            </p>
          ))}
          {!isLoading && marks.length === 0 ? <p className="text-sm text-slate-500">Sin entrenamientos registrados.</p> : null}
        </div>
      </div>
    </div>
  )
}

export default UserDetailModal
