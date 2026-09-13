// Dashboard Superadmin: métricas, socios, emails y avisos.
// Ruta protegida: solo `isAdmin` (email bootstrap o role='admin' en Firestore).
import { useEffect, useMemo, useState } from 'react'
import SectionCard from '../components/ui/SectionCard'
import MetricsCards from '../components/admin/MetricsCards'
import UsersTable from '../components/admin/UsersTable'
import UserDetailModal from '../components/admin/UserDetailModal'
import EmailComposer from '../components/admin/EmailComposer'
import AnnouncementsManager from '../components/admin/AnnouncementsManager'
import {
  computePlatformMetrics,
  deleteUserDataByAdmin,
  subscribeAllAnnouncements,
  subscribeAllUsers,
  updateUserByAdmin,
} from '../services/admin/adminService'
import { subscribeAllMarks } from '../services/firebase/userData'

function AdminPage({ isAdmin, onGoHome }) {
  const [section, setSection] = useState('resumen')
  const [users, setUsers] = useState([])
  const [marks, setMarks] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [emailTarget, setEmailTarget] = useState(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!isAdmin) return undefined
    const unsubs = [
      subscribeAllUsers(setUsers),
      subscribeAllMarks(setMarks),
      subscribeAllAnnouncements(setAnnouncements),
    ]
    return () => unsubs.forEach((u) => u())
  }, [isAdmin])

  const metrics = useMemo(() => computePlatformMetrics({ users, marks }), [users, marks])

  if (!isAdmin) {
    return (
      <SectionCard title="Zona restringida" subtitle="Panel Superadmin">
        <p className="text-sm text-slate-600">Tu cuenta no tiene rol de administrador.</p>
        <button type="button" className="mt-4 w-full rounded-2xl bg-brand-600 px-4 py-3 text-sm font-bold text-white" onClick={onGoHome}>
          Volver al inicio
        </button>
      </SectionCard>
    )
  }

  const handleUpdate = async (uid, patch) => {
    try {
      await updateUserByAdmin(uid, patch)
      setNotice('')
      return true
    } catch (error) {
      setNotice(
        error?.message === 'email-already-in-use'
          ? 'Ese email ya pertenece a otro socio.'
          : error?.message === 'invalid-email'
            ? 'El formato del email no es válido.'
          : 'No se pudo actualizar el usuario.',
      )
      return false
    }
  }

  const handleToggleStatus = async (u) => {
    const next = u.status === 'activo' ? 'suspendido' : 'activo'
    if (next === 'suspendido' && !window.confirm(`¿Suspender a ${u.email || u.uid}?`)) return
    await handleUpdate(u.uid, { status: next })
  }

  const handleDelete = async (u) => {
    if (!window.confirm(`¿Eliminar datos de ${u.email || u.uid}? Esta acción no borra su login de Auth.`)) return
    try {
      await deleteUserDataByAdmin(u.uid)
    } catch {
      setNotice('No se pudo eliminar al usuario.')
    }
  }

  return (
    <div className="space-y-4">
      <SectionCard title="Panel Superadmin" subtitle="Socios, comunicación, avisos y métricas">
        <div className="flex flex-wrap gap-2">
          {[
            ['resumen', 'Resumen'],
            ['usuarios', `Usuarios (${users.length})`],
            ['emails', 'Emails'],
            ['avisos', `Avisos (${announcements.length})`],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setSection(id)}
              className={`rounded-xl px-4 py-2 text-sm font-bold ${section === id ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700'}`}
            >
              {label}
            </button>
          ))}
        </div>
        {notice ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">{notice}</p> : null}
      </SectionCard>

      {section === 'resumen' ? <MetricsCards metrics={metrics} /> : null}

      {section === 'usuarios' ? (
        <SectionCard title="Socios" subtitle="Busca, filtra, edita rol/plan/estado o elimina">
          <UsersTable
            users={users}
            onView={setSelectedUser}
            onUpdate={handleUpdate}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDelete}
            onSendEmail={(u) => { setEmailTarget(u); setSection('emails') }}
          />
        </SectionCard>
      ) : null}

      {section === 'emails' ? (
        <SectionCard title="Comunicación" subtitle="Individual o newsletter a todos los socios">
          <EmailComposer key={emailTarget?.uid ?? 'bulk'} users={users} presetRecipient={emailTarget} />
        </SectionCard>
      ) : null}

      {section === 'avisos' ? (
        <SectionCard title="Avisos in-app" subtitle="Aparecen en la parte superior de la app">
          <AnnouncementsManager announcements={announcements} />
        </SectionCard>
      ) : null}

      {selectedUser ? <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} /> : null}
    </div>
  )
}

export default AdminPage
