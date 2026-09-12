import { useState } from 'react'
import SectionCard from '../components/ui/SectionCard'

const guideSteps = [
  {
    title: 'Paso 1: Registro y perfil del atleta',
    text: 'Inicia sesión con Google o continúa en modo anónimo. Completa días disponibles, duración de sesión, objetivos, deportes, material y molestias para que el entrenador pueda ajustar mejor la carga.',
    video: 'https://www.youtube.com/embed/VIDEO_ID_PERFIL',
    screenshot: 'Perfil con datos físicos, disponibilidad semanal y material disponible.',
  },
  {
    title: 'Paso 2: Strava o registro manual',
    text: 'Puedes conectar Strava para traer actividades automáticamente cuando configures tus credenciales, o añadir entrenamientos manualmente con distancia, duración, deporte, pulso, RPE y vatios.',
    video: 'https://www.youtube.com/embed/VIDEO_ID_STRAVA',
    screenshot: 'Modal de actividad manual con campos de entrenamiento.',
  },
  {
    title: 'Paso 3: Calendario inteligente y carga/fatiga',
    text: 'El calendario compara sesiones planificadas con sesiones reales. Si no completas una sesión o la carga cambia, la recomendación semanal se reajusta para los días restantes.',
    video: 'https://www.youtube.com/embed/VIDEO_ID_CALENDARIO',
    screenshot: 'Vista semanal con sesiones planificadas, completadas y panel de carga.',
  },
  {
    title: 'Paso 4: Nutrición y dieta semanal',
    text: 'El plan nutricional cambia según los días intensos, suaves o de descanso. Incluye macros orientativos, ideas de menú, consejos pre/post entreno y lista de compra.',
    video: 'https://www.youtube.com/embed/VIDEO_ID_NUTRICION',
    screenshot: 'Plan semanal con macros, menús y lista de compra.',
  },
]

function GuiaPage() {
  const [openStep, setOpenStep] = useState(0)

  return (
    <div className="space-y-4">
      <SectionCard title="Cómo funciona" subtitle="Guía visual para empezar en menos de 10 minutos">
        <div className="space-y-3">
          {guideSteps.map((step, index) => {
            const open = openStep === index
            return (
              <article key={step.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 text-left font-extrabold text-brand-900"
                  onClick={() => setOpenStep(open ? -1 : index)}
                >
                  <span>{step.title}</span>
                  <span>{open ? 'Cerrar' : 'Abrir'}</span>
                </button>

                {open ? (
                  <div className="mt-3 space-y-3 text-sm text-slate-700">
                    <p>{step.text}</p>
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-black">
                      <iframe
                        className="aspect-video w-full"
                        src={step.video}
                        title={step.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-slate-500">
                      Espacio para captura o imagen demostrativa: {step.screenshot}
                    </div>
                  </div>
                ) : null}
              </article>
            )
          })}
        </div>
      </SectionCard>
    </div>
  )
}

export default GuiaPage
