// Tabla de socios con búsqueda, filtros y paginación (todo en cliente).
import { useMemo, useState } from 'react'

const PAGE_SIZE = 10
const inputClass =
  'rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand-500'

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function UsersTable({ users, onView, onUpdate, onToggleStatus, onDelete, onSendEmail }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [planFilter, setPlanFilter] = useState('todos')
  const [stravaFilter, setStravaFilter] = useState('todos')
  const [fromDate, setFromDate] = useState('')
  const [page, setPage] = useState(0)
  const [emailDrafts, setEmailDrafts] = useState({})
  const [emailMsg, setEmailMsg] = useState('')

  const saveEmail = async (u) => {
    const draft = (emailDrafts[u.uid] ?? u.email ?? '').trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft)) {
      setEmailMsg('Email no válido. No se ha guardado.')
      return
    }
    const saved = await onUpdate(u.uid, { email: draft })
    if (!saved) return
    setEmailMsg('')
    setEmailDrafts((prev) => {
      const next = { ...prev }
      delete next[u.uid]
      return next
    })
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter((u) => {
      if (q && !`${u.nombre} ${u.email}`.toLowerCase().includes(q)) return false
      if (statusFilter !== 'todos' && u.status !== statusFilter) return false
      if (planFilter !== 'todos' && u.plan !== planFilter) return false
      if (stravaFilter === 'si' && !u.stravaConnected) return false
      if (stravaFilter === 'no' && u.stravaConnected) return false
      if (fromDate && u.createdAt && new Date(u.createdAt) < new Date(fromDate)) return false
      return true
    })
  }, [users, search, statusFilter, planFilter, stravaFilter, fromDate])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <input className={inputClass} placeholder="Buscar nombre o email" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0) }} />
        <select className={inputClass} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }}>
          <option value="todos">Estado: todos</option>
          <option value="activo">Activo</option>
          <option value="suspendido">Suspendido</option>
        </select>
        <select className={inputClass} value={planFilter} onChange={(e) => { setPlanFilter(e.target.value); setPage(0) }}>
          <option value="todos">Plan: todos</option>
          <option value="gratuito">Gratuito</option>
          <option value="pro">Pro</option>
          <option value="club">Club</option>
        </select>
        <select className={inputClass} value={stravaFilter} onChange={(e) => { setStravaFilter(e.target.value); setPage(0) }}>
          <option value="todos">Strava: todos</option>
          <option value="si">Strava sí</option>
          <option value="no">Strava no</option>
        </select>
        <input className={inputClass} type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(0) }} />
      </div>

      <p className="text-sm text-slate-500">{filtered.length} usuarios · página {page + 1} de {totalPages}</p>
      {emailMsg ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">{emailMsg}</p> : null}

      <div className="space-y-2">
        {pageItems.map((u) => (
          <article key={u.uid} className="rounded-2xl border border-slate-200 bg-white p-3 text-sm shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-extrabold text-brand-900">{u.nombre || '(sin nombre)'}</p>
                <p className="text-slate-600">{u.email || 'sin email (anónimo)'}</p>
                <p className="text-xs text-slate-500">
                  Alta: {formatDate(u.createdAt)} · Última sesión: {formatDate(u.lastLoginAt)} · Strava: {u.stravaConnected ? 'Sí' : 'No'}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${u.status === 'activo' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                {u.status}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                className={inputClass}
                type="email"
                title="Email de la cuenta (solo editable por admin)"
                value={emailDrafts[u.uid] ?? u.email ?? ''}
                placeholder="Email de la cuenta"
                onChange={(e) => setEmailDrafts((prev) => ({ ...prev, [u.uid]: e.target.value }))}
              />
              <button type="button" className="rounded-xl bg-brand-50 px-3 py-2 text-xs font-bold text-brand-900" onClick={() => saveEmail(u)}>Guardar email</button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <select className={inputClass} value={u.role} onChange={(e) => onUpdate(u.uid, { role: e.target.value })}>
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
              <select className={inputClass} value={u.plan} onChange={(e) => onUpdate(u.uid, { plan: e.target.value })}>
                <option value="gratuito">gratuito</option>
                <option value="pro">pro</option>
                <option value="club">club</option>
              </select>
              <button type="button" className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold" onClick={() => onView(u)}>Ver</button>
              <button type="button" className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold" onClick={() => onSendEmail(u)}>Email</button>
              <button type="button" className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800" onClick={() => onToggleStatus(u)}>
                {u.status === 'activo' ? 'Suspender' : 'Reactivar'}
              </button>
              <button type="button" className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700" onClick={() => onDelete(u)}>Eliminar</button>
            </div>
          </article>
        ))}
        {pageItems.length === 0 ? <p className="text-sm text-slate-500">Sin resultados con esos filtros.</p> : null}
      </div>

      <div className="flex gap-2">
        <button type="button" disabled={page === 0} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold disabled:opacity-40" onClick={() => setPage((p) => Math.max(0, p - 1))}>Anterior</button>
        <button type="button" disabled={page + 1 >= totalPages} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold disabled:opacity-40" onClick={() => setPage((p) => p + 1)}>Siguiente</button>
      </div>
    </div>
  )
}

export default UsersTable
