import { useEffect, useState } from 'react'
import Header from './components/layout/Header'
import BottomNav from './components/layout/BottomNav'
import PageContainer from './components/layout/PageContainer'
import { isAdminUser } from './config/admin'
import InicioPage from './pages/InicioPage'
import CalculadoraPage from './pages/CalculadoraPage'
import EntrenadorPage from './pages/EntrenadorPage'
import RitmoBasePage from './pages/RitmoBasePage'
import PerfilPage from './pages/PerfilPage'
import { useAppNavigation } from './hooks/useAppNavigation'
import { useFirebaseSession } from './hooks/useFirebaseSession'
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
  const [adminMarks, setAdminMarks] = useState([])
  const [publicRankings, setPublicRankings] = useState([])
  const [dataError, setDataError] = useState('')
  const [isProfileReady, setIsProfileReady] = useState(false)

  useEffect(() => {
    if (!user?.uid) return undefined

    let isActive = true
    const isAdmin = isAdminUser(user)

    const unsubscribeProfile = subscribeProfile(user.uid, (nextProfile) => {
      if (!isActive) return
      setProfile(nextProfile)
      setIsProfileReady(true)
    })

    const unsubscribeMarks = subscribeSavedMarks(user.uid, (nextMarks) => {
      if (!isActive) return
      setSavedMarks(nextMarks)
    })

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
      setAdminMarks([])
      setIsProfileReady(false)
      unsubscribeProfile()
      unsubscribeMarks()
      unsubscribeRankings()
      unsubscribeAdminMarks()
    }
  }, [user])

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
      await addUserMark(user.uid, entry)
      await registerPublicRankingMark({
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
    if (!user?.uid || !isAdminUser(user)) return

    try {
      await deleteAdminMark(userId, markId)
      setDataError('')
    } catch {
      setDataError('No se pudo borrar la marca como administrador.')
      throw new Error('delete-admin-mark-error')
    }
  }

  const renderPage = () => {
    if (currentTab === 'inicio') return <InicioPage publicRankings={publicRankings} />
    if (currentTab === 'calculadora') {
      return <CalculadoraPage profile={profile} onSaveMark={handleSaveMark} />
    }

    if (currentTab === 'entrenador') {
      return <EntrenadorPage profile={profile} savedMarks={savedMarks} onGoProfile={() => changeTab('perfil')} />
    }

    if (currentTab === 'ritmo') {
      return <RitmoBasePage />
    }

    return (
      <PerfilPage
        key={`${user?.uid}-${profile.nombre}-${profile.sexo}-${profile.cuerpoObjetivo}`}
        user={user}
        isAdmin={isAdminUser(user)}
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
      />
    )
  }

  const globalError = authError || dataError

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col bg-slate-50 shadow-card">
      <Header
        appName="App Opositor Policía"
        user={user}
        isAdmin={isAdminUser(user)}
        onAccountClick={() => changeTab('perfil')}
      />
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
      </PageContainer>
      <BottomNav tabs={tabs} currentTab={currentTab} onChangeTab={changeTab} />
    </main>
  )
}

export default App
