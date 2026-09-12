import { useMemo, useState } from 'react'
import AppButton from '../components/ui/AppButton'
import FormField from '../components/ui/FormField'
import SectionCard from '../components/ui/SectionCard'
import { ADMIN_EMAILS } from '../config/admin'
import { cuerpos, sexos } from '../utils/constants'
import { getTestsForSelection } from '../data/tests'
import { generateTrainingReport } from '../utils/reportGenerator'

const inputClass =
  'w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-800 outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const materialOptions = [
  { id: 'pista', label: 'Pista' },
  { id: 'gimnasio', label: 'Gimnasio' },
  { id: 'piscina', label: 'Piscina' },
  { id: 'barra', label: 'Barra' },
  { id: 'balon', label: 'Balón medicinal' },
]

function formatDate(isoDate) {
  const date = new Date(isoDate)
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function ProfilePage({
  user,
  isAdmin,
  isAuthActionLoading,
  onSignInWithGoogle,
  onSignOutGoogle,
  profile,
  onSaveProfile,
  savedMarks,
  adminMarks,
  onClearMarks,
  onDeleteMark,
  onDeleteAdminMark,
  onGoAdmin,
}) {
  const [form, setForm] = useState({
    nombre: profile?.nombre ?? '',
    sexo: profile?.sexo ?? '',
    cuerpoObjetivo: profile?.cuerpoObjetivo ?? '',
    peso: profile?.peso ?? '',
    altura: profile?.altura ?? '',
    edad: profile?.edad ?? '',
    fechaTipo: profile?.fechaTipo ?? 'aproximada',
    fechaConcreta: profile?.fechaConcreta ?? '',
    semanasAprox: profile?.semanasAprox ?? '',
    objetivos: profile?.objetivos ?? {},
    diasEntreno: profile?.diasEntreno ?? [],
    duracionSesion: profile?.duracionSesion ?? '60',
    experiencia: profile?.experiencia ?? 'intermedio',
    objetivoEntreno: profile?.objetivoEntreno ?? 'mejorar-nota',
    material: profile?.material ?? {},
    lesiones: profile?.lesiones ?? '',
  })
  const [message, setMessage] = useState('')

  const stats = useMemo(() => {
    const notes = savedMarks.filter((item) => item.tipoResultado === 'puntos' && typeof item.nota === 'number')
    const avgNote = notes.length
      ? notes.reduce((sum, item) => sum + item.nota, 0) / notes.length
      : null

    const byTest = savedMarks.reduce((acc, item) => {
      if (!acc[item.pruebaId]) {
        acc[item.pruebaId] = {
          pruebaNombre: item.pruebaNombre,
          count: 0,
          sum: 0,
        }
      }

      acc[item.pruebaId].count += 1
      acc[item.pruebaId].sum += item.marcaNormalizada
      return acc
    }, {})

    const averagesByTest = Object.values(byTest)
      .map((entry) => ({
        pruebaNombre: entry.pruebaNombre,
        mediaMarca: entry.sum / entry.count,
        count: entry.count,
      }))
      .sort((a, b) => b.count - a.count)

    return { avgNote, averagesByTest }
  }, [savedMarks])

  const objectiveTests = useMemo(
    () => getTestsForSelection(form.cuerpoObjetivo, form.sexo),
    [form.cuerpoObjetivo, form.sexo],
  )

  const report = useMemo(
    () => generateTrainingReport({ profile: form, savedMarks }),
    [form, savedMarks],
  )

  const validateProfileForm = () => {
    const peso = Number(form.peso)
    const altura = Number(form.altura)
    const edad = Number(form.edad)
    const duracionSesion = Number(form.duracionSesion)

    if (!form.sexo) return 'Selecciona el sexo para personalizar pruebas y objetivos.'
    if (form.edad && (!Number.isFinite(edad) || edad < 16 || edad > 65)) {
      return 'Introduce una edad razonable.'
    }
    if (form.peso && (!Number.isFinite(peso) || peso < 35 || peso > 180)) {
      return 'Introduce un peso razonable en kg.'
    }
    if (form.altura && (!Number.isFinite(altura) || altura < 130 || altura > 230)) {
      return 'Introduce una altura razonable en cm.'
    }
    if (form.fechaTipo === 'concreta' && form.fechaConcreta) {
      const examDate = new Date(form.fechaConcreta)
      const today = new Date()
      if (examDate.setHours(0, 0, 0, 0) < today.setHours(0, 0, 0, 0)) {
        return 'La fecha de examen no puede estar en el pasado.'
      }
    }
    if (form.fechaTipo === 'aproximada' && form.semanasAprox) {
      const weeks = Number(form.semanasAprox)
      if (!Number.isFinite(weeks) || weeks < 0 || weeks > 104) {
        return 'Introduce semanas aproximadas entre 0 y 104.'
      }
    }
    if (form.duracionSesion && (!Number.isFinite(duracionSesion) || duracionSesion < 20 || duracionSesion > 180)) {
      return 'La duración de sesión debe estar entre 20 y 180 minutos.'
    }

    return ''
  }

  const toggleTrainingDay = (day) => {
    setForm((prev) => {
      const currentDays = prev.diasEntreno ?? []
      const nextDays = currentDays.includes(day)
        ? currentDays.filter((item) => item !== day)
        : [...currentDays, day]

      return { ...prev, diasEntreno: nextDays }
    })
  }

  const toggleMaterial = (materialId) => {
    setForm((prev) => ({
      ...prev,
      material: {
        ...prev.material,
        [materialId]: !prev.material?.[materialId],
      },
    }))
  }

  const onSubmit = async (event) => {
    event.preventDefault()

    const validationError = validateProfileForm()
    if (validationError) {
      setMessage(validationError)
      return
    }

    try {
      await onSaveProfile(form)
      setMessage('Perfil y objetivos guardados correctamente.')
    } catch {
      setMessage('No se pudo guardar el perfil. Revisa Firebase e inténtalo de nuevo.')
    }
  }

  const onRemoveHistory = async () => {
    try {
      await onClearMarks()
      setMessage('Historial de marcas eliminado.')
    } catch {
      setMessage('No se pudo borrar el historial. Revisa Firebase e inténtalo de nuevo.')
    }
  }

  const onRemoveMark = async (markId) => {
    try {
      await onDeleteMark(markId)
      setMessage('Marca eliminada correctamente.')
    } catch {
      setMessage('No se pudo borrar la marca. Revisa Firebase e inténtalo de nuevo.')
    }
  }

  const onRemoveAdminMark = async (entry) => {
    try {
      await onDeleteAdminMark({ userId: entry.userId, markId: entry.id })
      setMessage('Marca borrada por administrador.')
    } catch {
      setMessage('No se pudo borrar la marca como administrador.')
    }
  }

  const onGoogleLogin = async () => {
    try {
      await onSignInWithGoogle()
      setMessage('Sesión de Google iniciada. Tu perfil ya queda vinculado.')
    } catch {
      setMessage('No se pudo iniciar sesión con Google.')
    }
  }

  const onGoogleLogout = async () => {
    try {
      await onSignOutGoogle()
      setMessage('Sesión de Google cerrada. Sigues con sesión anónima.')
    } catch {
      setMessage('No se pudo cerrar sesión de Google.')
    }
  }

  return (
    <div className="space-y-4">
      <SectionCard title="Cuenta" subtitle="Gestiona si quieres usar Google o continuar sin registrarte">
        {user?.isAnonymous ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-700">
              Ahora mismo estás sin cuenta Google. Puedes guardar marcas igualmente en este dispositivo.
            </p>
            <AppButton type="button" onClick={onGoogleLogin} disabled={isAuthActionLoading}>
              {isAuthActionLoading ? 'Conectando...' : 'Iniciar sesión con Google'}
            </AppButton>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-700">
              Sesión activa como <strong>{user?.email ?? 'usuario Google'}</strong>
            </p>
            <p className="text-sm text-slate-500">
              Tus datos personales, objetivo y marcas se pueden cambiar en el formulario de debajo.
            </p>
            <AppButton
              type="button"
              variant="secondary"
              onClick={onGoogleLogout}
              disabled={isAuthActionLoading}
            >
              {isAuthActionLoading ? 'Cerrando...' : 'Salir de Google y seguir sin registrarme'}
            </AppButton>
          </div>
        )}
      </SectionCard>

      {isAdmin ? (
        <SectionCard title="Administración" subtitle={`Panel activo para ${ADMIN_EMAILS.join(' / ')}`}>
          <AppButton type="button" onClick={onGoAdmin}>
            Abrir Dashboard Superadmin
          </AppButton>
          {adminMarks.length === 0 ? (
            <p className="text-sm text-slate-500">No hay marcas guardadas todavía.</p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-700">Registros totales: {adminMarks.length}</p>
              {adminMarks.slice(0, 50).map((entry) => (
                <article
                  key={`${entry.userId}-${entry.id}`}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"
                >
                  <p>
                    <strong>{entry.pruebaNombre}</strong> · {entry.cuerpoNombre} · {entry.sexo}
                  </p>
                  <p>
                    Marca: {entry.marcaMostrada} · Resultado:{' '}
                    {entry.tipoResultado === 'puntos'
                      ? `${Number(entry.nota ?? 0).toFixed(2)} puntos`
                      : entry.esApto
                        ? 'Apto'
                        : 'No apto'}
                  </p>
                  <p className="text-xs text-slate-500">Usuario: {entry.userId}</p>
                  <p className="text-xs text-slate-500">Fecha: {formatDate(entry.fecha)}</p>
                  <div className="mt-2">
                    <button
                      type="button"
                      className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 active:bg-rose-100"
                      onClick={() => onRemoveAdminMark(entry)}
                    >
                      Borrar esta marca como admin
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </SectionCard>
      ) : null}

      <SectionCard title="Perfil y objetivo" subtitle="Define tus datos físicos y metas de prueba">
        <form className="space-y-4" onSubmit={onSubmit}>
          <FormField label="Nombre">
            <input
              className={inputClass}
              type="text"
              value={form.nombre}
              placeholder="Escribe tu nombre"
              onChange={(event) => setForm((prev) => ({ ...prev, nombre: event.target.value }))}
            />
          </FormField>

          <FormField label="Sexo">
            <select
              className={inputClass}
              value={form.sexo}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, sexo: event.target.value, objetivos: {}, cuerpoObjetivo: '' }))
              }
            >
              <option value="">Selecciona sexo</option>
              {sexos.map((sexoItem) => (
                <option key={sexoItem} value={sexoItem}>
                  {sexoItem}
                </option>
              ))}
            </select>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Edad">
              <input
                className={inputClass}
                type="number"
                value={form.edad}
                placeholder="Ej: 29"
                onChange={(event) => setForm((prev) => ({ ...prev, edad: event.target.value }))}
              />
            </FormField>

            <FormField label="Peso (kg)">
              <input
                className={inputClass}
                type="number"
                step="0.1"
                value={form.peso}
                placeholder="Ej: 78.4"
                onChange={(event) => setForm((prev) => ({ ...prev, peso: event.target.value }))}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">

            <FormField label="Altura (cm)">
              <input
                className={inputClass}
                type="number"
                step="0.1"
                value={form.altura}
                placeholder="Ej: 182"
                onChange={(event) => setForm((prev) => ({ ...prev, altura: event.target.value }))}
              />
            </FormField>

            <FormField label="Duración sesión">
              <input
                className={inputClass}
                type="number"
                min="20"
                value={form.duracionSesion}
                placeholder="Ej: 60"
                onChange={(event) => setForm((prev) => ({ ...prev, duracionSesion: event.target.value }))}
              />
            </FormField>
          </div>

          <FormField label="Cuerpo objetivo">
            <select
              className={inputClass}
              value={form.cuerpoObjetivo}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, cuerpoObjetivo: event.target.value, objetivos: {} }))
              }
            >
              <option value="">Selecciona cuerpo</option>
              {cuerpos.map((cuerpo) => (
                <option key={cuerpo.id} value={cuerpo.id}>
                  {cuerpo.nombre}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Tipo de fecha de examen">
            <select
              className={inputClass}
              value={form.fechaTipo}
              onChange={(event) => setForm((prev) => ({ ...prev, fechaTipo: event.target.value }))}
            >
              <option value="aproximada">Aproximada</option>
              <option value="concreta">Concreta</option>
            </select>
          </FormField>

          {form.fechaTipo === 'concreta' ? (
            <FormField label="Fecha de examen">
              <input
                className={inputClass}
                type="date"
                value={form.fechaConcreta}
                onChange={(event) => setForm((prev) => ({ ...prev, fechaConcreta: event.target.value }))}
              />
            </FormField>
          ) : (
            <FormField label="Semanas aproximadas hasta examen">
              <input
                className={inputClass}
                type="number"
                min="0"
                value={form.semanasAprox}
                placeholder="Ej: 16"
                onChange={(event) => setForm((prev) => ({ ...prev, semanasAprox: event.target.value }))}
              />
            </FormField>
          )}

          {objectiveTests.length > 0 ? (
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-700">Marcas objetivo</p>
              {objectiveTests.map((test) => (
                <FormField key={test.id} label={test.nombre}>
                  <input
                    className={inputClass}
                    type="text"
                    value={form.objetivos?.[test.id] ?? ''}
                    placeholder={test.tipoEntrada === 'time' ? 'Ej: 3:25' : 'Ej: 15'}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        objetivos: {
                          ...prev.objetivos,
                          [test.id]: event.target.value,
                        },
                      }))
                    }
                  />
                </FormField>
              ))}
            </div>
          ) : null}

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-700">Disponibilidad de entrenamiento</p>
            <div className="grid grid-cols-2 gap-2">
              {weekDays.map((day) => (
                <button
                  key={day}
                  type="button"
                  className={`rounded-xl px-3 py-2 text-sm font-bold ${
                    form.diasEntreno?.includes(day) ? 'bg-brand-600 text-white' : 'bg-white text-slate-700'
                  }`}
                  onClick={() => toggleTrainingDay(day)}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Experiencia">
              <select
                className={inputClass}
                value={form.experiencia}
                onChange={(event) => setForm((prev) => ({ ...prev, experiencia: event.target.value }))}
              >
                <option value="principiante">Principiante</option>
                <option value="intermedio">Intermedio</option>
                <option value="avanzado">Avanzado</option>
              </select>
            </FormField>

            <FormField label="Objetivo">
              <select
                className={inputClass}
                value={form.objetivoEntreno}
                onChange={(event) => setForm((prev) => ({ ...prev, objetivoEntreno: event.target.value }))}
              >
                <option value="aprobar">Aprobar</option>
                <option value="mejorar-nota">Mejorar nota</option>
                <option value="completo">Preparación completa</option>
              </select>
            </FormField>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-700">Material disponible</p>
            <div className="grid grid-cols-2 gap-2">
              {materialOptions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`rounded-xl px-3 py-2 text-sm font-bold ${
                    form.material?.[item.id] ? 'bg-brand-600 text-white' : 'bg-white text-slate-700'
                  }`}
                  onClick={() => toggleMaterial(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <FormField label="Lesiones o molestias">
            <textarea
              className={inputClass}
              value={form.lesiones}
              placeholder="Ej: molestias en rodilla derecha, sobrecarga de gemelos..."
              rows="3"
              onChange={(event) => setForm((prev) => ({ ...prev, lesiones: event.target.value }))}
            />
          </FormField>

          {message ? (
            <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{message}</p>
          ) : null}

          <AppButton type="submit">Guardar perfil</AppButton>
        </form>
      </SectionCard>

      <SectionCard title="Informe recomendado" subtitle="Plan general de entrenamiento en base a tus datos">
        {report.ok ? (
          <div className="space-y-3 text-sm text-slate-700">
            <p>
              <strong>Frecuencia sugerida:</strong> {report.frequency}
            </p>
            <p>
              <strong>Tiempo hasta examen:</strong>{' '}
              {report.weeksToExam === null ? 'sin definir' : `${report.weeksToExam} semanas`}
            </p>
            <p className="rounded-2xl bg-brand-50 p-3 font-semibold text-brand-900">
              {report.mainPriority}
            </p>

            <div className="space-y-2">
              <p className="font-bold text-slate-800">Qué entrenar ahora:</p>
              {report.testAnalysis.map((item) => (
                <p key={item.testName}>
                  <strong>{item.testName}:</strong> {item.recommendation}
                </p>
              ))}
            </div>

            <div className="space-y-2">
              <p className="font-bold text-slate-800">Cómo entrenar (general):</p>
              {report.generalTips.map((tip) => (
                <p key={tip}>- {tip}</p>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">{report.error}</p>
        )}
      </SectionCard>

      <SectionCard title="Resumen" subtitle="Media de tus resultados guardados">
        <p className="text-sm text-slate-700">
          <strong>Media de nota (pruebas baremadas): </strong>
          {stats.avgNote === null ? 'Sin datos todavía' : `${stats.avgNote.toFixed(2)} puntos`}
        </p>

        {stats.averagesByTest.length > 0 ? (
          <div className="mt-4 space-y-2">
            {stats.averagesByTest.map((item) => (
              <p key={item.pruebaNombre} className="text-sm text-slate-700">
                <strong>{item.pruebaNombre}:</strong> media {item.mediaMarca.toFixed(2)} ({item.count}{' '}
                registros)
              </p>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">Aún no hay marcas guardadas.</p>
        )}
      </SectionCard>

      <SectionCard title="Historial" subtitle="Últimas marcas guardadas en tu perfil">
        {savedMarks.length === 0 ? (
          <p className="text-sm text-slate-500">Todavía no has guardado marcas desde la calculadora.</p>
        ) : (
          <div className="space-y-2">
            {savedMarks.slice(0, 10).map((entry) => (
              <article
                key={entry.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"
              >
                <p>
                  <strong>{entry.pruebaNombre}</strong> · {entry.cuerpoNombre} · {entry.sexo}
                </p>
                <p>
                  Marca: {entry.marcaMostrada} · Resultado:{' '}
                  {entry.tipoResultado === 'puntos'
                    ? `${entry.nota.toFixed(2)} puntos`
                    : entry.esApto
                      ? 'Apto'
                      : 'No apto'}
                </p>
                <p className="text-xs text-slate-500">{formatDate(entry.fecha)}</p>
                <div className="mt-2">
                  <button
                    type="button"
                    className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 active:bg-rose-100"
                    onClick={() => onRemoveMark(entry.id)}
                  >
                    Eliminar esta marca
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {savedMarks.length > 0 ? (
          <div className="mt-4">
            <AppButton type="button" variant="secondary" onClick={onRemoveHistory}>
              Borrar historial
            </AppButton>
          </div>
        ) : null}
      </SectionCard>
    </div>
  )
}

export default ProfilePage
