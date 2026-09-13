import AppButton from '../ui/AppButton'
import SectionCard from '../ui/SectionCard'
import { logAnalyticsEvent } from '../../services/firebase/firebaseClient'

function ConversionCard({ user, title, description, primaryLabel, registeredLabel, onPrimary }) {
  const isAnonymous = !user || user.isAnonymous

  const handleClick = () => {
    if (isAnonymous) logAnalyticsEvent('cta_plan_clicked')
    onPrimary()
  }

  return (
    <SectionCard
      title={isAnonymous ? title : 'Convierte este resultado en un plan'}
      subtitle={isAnonymous ? description : 'Guarda tu marca y úsala para organizar tu preparación'}
    >
      <p className="text-sm leading-relaxed text-slate-700">
        {isAnonymous
          ? 'La aplicación puede ayudarte con planificación, seguimiento, calendario y progresión hasta tus pruebas.'
          : 'Tu cuenta ya está preparada para seguir tu evolución y ajustar el entrenamiento.'}
      </p>
      <p className="mt-2 text-sm font-extrabold text-brand-900">
        {isAnonymous ? 'Todo el uso de la app es gratuito actualmente.' : 'Sin suscripciones ni datos de pago.'}
      </p>
      <div className="mt-4">
        <AppButton type="button" onClick={handleClick}>
          {isAnonymous ? primaryLabel : registeredLabel}
        </AppButton>
      </div>
    </SectionCard>
  )
}

export default ConversionCard
