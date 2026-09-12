import { useLocalStorageState } from '../../hooks/useLocalStorageState'

function CookieConsent({ onPrivacyClick }) {
  const [consent, setConsent] = useLocalStorageState('cookie-consent-v1', null)

  if (consent) return null

  return (
    <section className="fixed inset-x-3 bottom-20 z-40 mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl lg:bottom-4">
      <p className="font-extrabold text-brand-900">Privacidad y cookies</p>
      <p className="mt-2 text-sm text-slate-600">
        Usamos Firebase/Vercel Analytics para medir tráfico y podemos mostrar anuncios de Google AdSense. También tratamos datos deportivos que introduces para generar recomendaciones. Puedes aceptar o continuar solo con cookies necesarias.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <button
          type="button"
          className="rounded-2xl bg-brand-600 px-4 py-3 text-sm font-bold text-white"
          onClick={() => setConsent('accepted')}
        >
          Aceptar
        </button>
        <button
          type="button"
          className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700"
          onClick={() => setConsent('necessary')}
        >
          Solo necesarias
        </button>
        <button type="button" className="rounded-2xl px-4 py-3 text-sm font-bold text-brand-700" onClick={onPrivacyClick}>
          Ver política
        </button>
      </div>
    </section>
  )
}

export default CookieConsent
