import { useEffect, useState } from 'react'
import Header from './components/layout/Header'
import BottomNav from './components/layout/BottomNav'
import PageContainer from './components/layout/PageContainer'
import Sidebar from './components/layout/Sidebar'
import Footer from './components/layout/Footer'
import CookieConsent from './components/legal/CookieConsent'
import { useAdminRole } from './hooks/useAdminRole'
import { subscribeActiveAnnouncements } from './services/admin/adminService'
import { ensureUserMetadata } from './services/firebase/userData'
import InicioPage from './pages/InicioPage'
import AdminPage from './pages/AdminPage'
import CalculadoraPage from './pages/CalculadoraPage'
import CalendarioPage from './pages/CalendarioPage'
import CoachPage from './pages/CoachPage'
import EntrenadorPage from './pages/EntrenadorPage'
import GuiaPage from './pages/GuiaPage'
import NutricionPage from './pages/NutricionPage'
import PrivacidadCookiesPage from './pages/PrivacidadCookiesPage'
import RitmoBasePage from './pages/RitmoBasePage'
import SobreContactoPage from './pages/SobreContactoPage'
import PerfilPage from './pages/PerfilPage'
import { useAppNavigation } from './hooks/useAppNavigation'
import { applySeo } from './utils/seo'
import { useFirebaseSession } from './hooks/useFirebaseSession'
import { auth, logAnalyticsEvent } from './services/firebase/firebaseClient'
import {
  addUserMark,
  clearUserMarks,
  deleteAdminMark,
  deleteUserMark,
  registerPublicRankingMark,
  saveUserProfile,
  subscribeAllMarks,
  subscribePublicRankings,
  subscribeProfile,
  subscribeSavedMarks,
  subscribeUserActivities,
  subscribeUserWellbeing,
  saveUserActivity,
  deleteUserActivity,
  saveUserWellbeing,
} from './services/firebase/userData'

const emptyProfile = {
  nombre: '',
  sexo: '',
  cuerpoObjetivo: '',
  peso: '',
  altura: '',
  edad: '',
  fechaTipo: 'aproximada',
  fechaConcreta: '',
  semanasAprox: '',
  objetivos: {},
  diasEntreno: [],
  duracionSesion: '60',
  experiencia: 'intermedio',
  objetivoEntreno: 'mejorar-nota',
  material: {},
  lesiones: '',
}

function App() {
  const { currentTab, tabs, changeTab } = useAppNavigation()
  const {
    user,
    isLoading: isAuthLoading,
    isAuthActionLoading,
    error: authError,
    signInWithGoogle,
    signOutAndContinueAnonymous,
  } = useFirebaseSession()
  const [profile, setProfile] = useState(emptyProfile)
  const [savedMarks, setSavedMarks] = useState([])
  const [activities, setActivities] = useState([])
  const [wellbeing, setWellbeing] = useState([])
  const [adminMarks, setAdminMarks] = useState([])
  const [publicRankings, setPublicRankings] = useState([])
  const [dataError, setDataError] = useState('')
  const [isProfileReady, setIsProfileReady] = useState(false)
  const [activeAnnouncements, setActiveAnnouncements] = useState([])
  const [planningContext, setPlanningContext] = useState(null)
  const { isAdmin, roleDoc, isLoading: isAdminLoading } = useAdminRole(user)
  const visibleTabs = tabs.filter((t) => !t.adminOnly || isAdmin)

  useEffect(() => {
    if (!user?.uid) return undefined

    ensureUserMetadata(user.uid, { email: user.email ?? '', isAnonymous: user.isAnonymous }).catch(() => {})

    let isActive = true
    const unsubscribeProfile = subscribeProfile(user.uid, (nextProfile) => {
      if (!isActive) return
      setProfile(nextProfile)
      setIsProfileReady(true)
    })

    const unsubscribeMarks = subscribeSavedMarks(user.uid, (nextMarks) => {
      if (!isActive) return
      setSavedMarks(nextMarks)
    })

    const unsubscribeActivities = subscribeUserActivities(user.uid, setActivities)
    const unsubscribeWellbeing = subscribeUserWellbeing(user.uid, setWellbeing)

    const unsubscribeRankings = subscribePublicRankings((nextRankings) => {
      if (!isActive) return
      setPublicRankings(nextRankings)
    })

    const unsubscribeAdminMarks = isAdmin
      ? subscribeAllMarks((nextMarks) => {
          if (!isActive) return
          setAdminMarks(nextMarks)
        })
      : () => {}

    return () => {
      isActive = false
      setProfile(emptyProfile)
      setSavedMarks([])
      setActivities([])
      setWellbeing([])
      setAdminMarks([])
      setIsProfileReady(false)
      unsubscribeProfile()
      unsubscribeMarks()
      unsubscribeActivities()
      unsubscribeWellbeing()
      unsubscribeRankings()
      unsubscribeAdminMarks()
    }
  }, [user, isAdmin])

  useEffect(() => {
    if (!isAuthLoading && !isAdminLoading && currentTab === 'admin' && !isAdmin) {
      changeTab('inicio', { replace: true })
    }
  }, [changeTab, currentTab, isAdmin, isAdminLoading, isAuthLoading])

  useEffect(() => {
    applySeo(currentTab)
    logAnalyticsEvent('page_view', { page_title: currentTab, page_location: window.location.href })
  }, [currentTab])

  useEffect(() => {
    const unsub = subscribeActiveAnnouncements(setActiveAnnouncements)
    return unsub
  }, [])

  const handleSaveProfile = async (nextProfile) => {
    if (!user?.uid) return

    try {
      await saveUserProfile(user.uid, nextProfile)
      setDataError('')
    } catch {
      setDataError('No se pudo guardar el perfil en Firebase.')
      throw new Error('save-profile-error')
    }
  }

  const handleSaveMark = async (entry) => {
    if (!user?.uid) return

    try {
      const markId = await addUserMark(user.uid, entry)
      await registerPublicRankingMark({
        markId,
        testId: entry.pruebaId,
        testName: entry.pruebaNombre,
        sexo: entry.sexo,
        mark: entry.marcaNormalizada,
      })
      setDataError('')
    } catch {
      setDataError('No se pudo guardar la marca en Firebase.')
      throw new Error('save-mark-error')
    }
  }

  const handleSaveActivity = async (activityId, activity) => {
    if (!user?.uid) return
    await saveUserActivity(user.uid, activityId, activity)
  }

  const handleDeleteActivity = async (activityId) => {
    if (!user?.uid) return
    await deleteUserActivity(user.uid, activityId)
  }

  const handleSaveWellbeing = async (wellbeingId, entry) => {
    if (!user?.uid) return
    await saveUserWellbeing(user.uid, wellbeingId, entry)
  }

  const handleSyncStrava = async () => {
    const token = await auth.currentUser?.getIdToken()
    const response = await fetch('/api/strava/sync', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error ?? 'strava-sync-failed')
    return payload.synced
  }

  const handleGoProfile = (context = null) => {
    setPlanningContext(context)
    if (context) {
      try {
        sessionStorage.setItem('pending-plan-context', JSON.stringify(context))
      } catch {
        // El contexto también se mantiene en estado si el navegador bloquea storage.
      }
    }
    changeTab('perfil')
  }

  const handleClearMarks = async () => {
    if (!user?.uid) return

    try {
      await clearUserMarks(user.uid)
      setDataError('')
    } catch {
      setDataError('No se pudo borrar el historial en Firebase.')
      throw new Error('clear-marks-error')
    }
  }

  const handleDeleteMark = async (markId) => {
    if (!user?.uid) return

    try {
      await deleteUserMark(user.uid, markId)
      setDataError('')
    } catch {
      setDataError('No se pudo borrar la marca en Firebase.')
      throw new Error('delete-mark-error')
    }
  }

  const handleDeleteAdminMark = async ({ userId, markId }) => {
    if (!user?.uid || !isAdmin) return

    try {
      await deleteAdminMark(userId, markId)
      setDataError('')
    } catch {
      setDataError('No se pudo borrar la marca como administrador.')
      throw new Error('delete-admin-mark-error')
    }
  }

  const renderPage = () => {
    if (currentTab === 'inicio') return <InicioPage publicRankings={publicRankings} user={user} onGoProfile={() => handleGoProfile()} />
    if (currentTab === 'guia') return <GuiaPage />
    if (currentTab === 'calculadora') {
      return <CalculadoraPage profile={profile} user={user} onSaveMark={handleSaveMark} onGoProfile={handleGoProfile} />
    }

    if (currentTab === 'calendario') {
      return (
        <CalendarioPage
          profile={profile}
          user={user}
          activities={activities}
          wellbeing={wellbeing}
          onSaveActivity={handleSaveActivity}
          onDeleteActivity={handleDeleteActivity}
          onSaveWellbeing={handleSaveWellbeing}
          onSyncStrava={handleSyncStrava}
        />
      )
    }

    if (currentTab === 'entrenador') {
      return <EntrenadorPage profile={profile} savedMarks={savedMarks} activities={activities} wellbeing={wellbeing} onGoProfile={() => changeTab('perfil')} />
    }

    if (currentTab === 'coach') return <CoachPage user={user} profile={profile} savedMarks={savedMarks} activities={activities} wellbeing={wellbeing} />

    if (currentTab === 'nutricion') return <NutricionPage profile={profile} />

    if (currentTab === 'ritmo') {
      return <RitmoBasePage user={user} onGoProfile={handleGoProfile} onGoTrainer={() => changeTab('entrenador')} />
    }

    if (currentTab === 'sobre') return <SobreContactoPage />
    if (currentTab === 'privacidad') return <PrivacidadCookiesPage />
    if (currentTab === 'admin') {
      if (isAdminLoading) return <p className="text-sm text-slate-500">Verificando permisos…</p>
      return <AdminPage isAdmin={isAdmin} onGoHome={() => changeTab('inicio')} />
    }

    return (
      <PerfilPage
        key={`${user?.uid}-${profile.nombre}-${profile.sexo}-${profile.cuerpoObjetivo}-${planningContext?.pruebaId ?? ''}`}
        user={user}
        isAdmin={isAdmin}
        accountEmail={roleDoc?.email || user?.email || ''}
        planningContext={planningContext}
        isAuthActionLoading={isAuthActionLoading}
        onSignInWithGoogle={signInWithGoogle}
        onSignOutGoogle={signOutAndContinueAnonymous}
        profile={profile}
        onSaveProfile={handleSaveProfile}
        savedMarks={savedMarks}
        adminMarks={adminMarks}
        onClearMarks={handleClearMarks}
        onDeleteMark={handleDeleteMark}
        onDeleteAdminMark={handleDeleteAdminMark}
        onGoAdmin={() => changeTab('admin')}
      />
    )
  }

  const globalError = authError || dataError

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-6xl flex-col bg-slate-50 shadow-card">
      <Header
        appName="App Opositor Policía"
        user={user}
        isAdmin={isAdmin}
        onAccountClick={() => changeTab('perfil')}
      />
      {activeAnnouncements.length > 0 ? (
        <div className="space-y-2 bg-amber-50 px-5 py-3">
          {activeAnnouncements.map((a) => (
            <p key={a.id} className="text-sm font-bold text-amber-900">
              {a.title}: <span className="font-semibold">{a.message}</span>
            </p>
          ))}
        </div>
      ) : null}
      <div className="flex flex-1 gap-4 overflow-hidden p-0 lg:p-5">
        <Sidebar tabs={visibleTabs} currentTab={currentTab} onChangeTab={changeTab} />
        <PageContainer>
          {isAuthLoading || (!authError && !isProfileReady) ? (
            <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              Conectando con Firebase...
            </p>
          ) : (
            renderPage()
          )}

          {globalError ? (
            <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{globalError}</p>
          ) : null}

          <Footer onNavigate={changeTab} />
        </PageContainer>
      </div>
      <BottomNav tabs={visibleTabs} currentTab={currentTab} onChangeTab={changeTab} />
      <CookieConsent onPrivacyClick={() => changeTab('privacidad')} />
    </main>
  )
}

export default App
