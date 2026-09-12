// Gestor de avisos globales in-app (activar/desactivar + caducidad).
import { useState } from 'react'
import { deleteAnnouncement, saveAnnouncement } from '../../services/admin/adminService'

const inputClass =
  'w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-500'

function AnnouncementsManager({ announcements }) {
  const [form, setForm] = useState({ id: null, title: '', message: '', active: true, expiresAtISO: '' })
  const [status, setStatus] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.message.trim()) { setStatus('Título y mensaje obligatorios.'); return }
    try {
      await saveAnnouncement(form)
      setForm({ id: null, title: '', message: '', active: true, expiresAtISO: '' })
      setStatus('Aviso guardado.')
    } catch {
      setStatus('No se pudo guardar el aviso.')
    }
  }

  const onEdit = (a) => {
    const exp = a.expiresAt && typeof a.expiresAt.toDate === 'function'
      ? a.expiresAt.toDate().toISOString().slice(0, 16)
      : ''
    setForm({ id: a.id, title: a.title ?? '', message: a.message ?? '', active: a.active !== false, expiresAtISO: exp })
  }

  return (
    <div className="space-y-3">
      <form onSubmit={onSubmit} className="space-y-2 rounded-3xl border border-slate-200 bg-white p-4 shadow-card">
        <input className={inputClass} placeholder="Título del aviso" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
        <textarea className={inputClass} rows="3" placeholder="Mensaje para los usuarios…" value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} />
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))} />
            Aviso activo
          </label>
          <input className={inputClass} type="datetime-local" value={form.expiresAtISO} onChange={(e) => setForm((p) => ({ ...p, expiresAtISO: e.target.value }))} />
        </div>
        <button type="submit" className="w-full rounded-2xl bg-brand-600 px-4 py-3 text-sm font-bold text-white">
          {form.id ? 'Actualizar aviso' : 'Publicar aviso'}
        </button>
        {status ? <p className="text-sm font-semibold text-slate-600">{status}</p> : null}
      </form>

      <div className="space-y-2">
        {announcements.map((a) => (
          <article key={a.id} className="rounded-2xl border border-slate-200 bg-white p-3 text-sm shadow-card">
            <p className="font-extrabold text-brand-900">{a.title} {a.active === false ? '(desactivado)' : ''}</p>
            <p className="text-slate-600">{a.message}</p>
            <div className="mt-2 flex gap-2">
              <button type="button" className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold" onClick={() => onEdit(a)}>Editar</button>
              <button type="button" className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700" onClick={() => deleteAnnouncement(a.id)}>Eliminar</button>
            </div>
          </article>
        ))}
        {announcements.length === 0 ? <p className="text-sm text-slate-500">No hay avisos publicados.</p> : null}
      </div>
    </div>
  )
}

export default AnnouncementsManager
