import SectionCard from '../components/ui/SectionCard'

function SobreContactoPage() {
  return (
    <div className="space-y-4">
      <SectionCard title="Sobre nosotros" subtitle="Preparación física para opositores">
        <div className="space-y-3 text-sm leading-relaxed text-slate-700">
          <p>
            App Opositor Policía nace para ayudar a opositores a registrar marcas, planificar sesiones, controlar la carga semanal y entender mejor su preparación física.
          </p>
          <p>
            La aplicación combina calculadoras de baremos, calendario, recomendaciones de entrenamiento y orientación nutricional general. No sustituye a entrenadores, médicos ni nutricionistas titulados.
          </p>
        </div>
      </SectionCard>

      <SectionCard title="Contacto" subtitle="Soporte, correcciones de baremos y sugerencias">
        <div className="space-y-3 text-sm text-slate-700">
          <p>Email de contacto: <strong>oposicionfisica@gmail.com</strong></p>
          <p>Para reportar un fallo indica dispositivo, navegador, prueba seleccionada, marca introducida y captura si es posible.</p>
          <p>Si quieres corregir un baremo, envía fuente oficial, año de convocatoria y tabla completa.</p>
        </div>
      </SectionCard>
    </div>
  )
}

export default SobreContactoPage
