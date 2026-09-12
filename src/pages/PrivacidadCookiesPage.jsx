import SectionCard from '../components/ui/SectionCard'

function PrivacidadCookiesPage() {
  return (
    <div className="space-y-4">
      <SectionCard title="Política de privacidad y cookies" subtitle="Información conforme al RGPD">
        <div className="space-y-3 text-sm leading-relaxed text-slate-700">
          <p>
            Esta aplicación puede tratar datos identificativos básicos, datos de perfil deportivo, marcas, sesiones, sensaciones de esfuerzo, peso, altura, lesiones o molestias introducidas voluntariamente por el usuario.
          </p>
          <p>
            Algunos datos pueden considerarse sensibles o relacionados con salud/rendimiento. Úsalos solo si aceptas que se almacenen para generar informes, entrenamiento y recomendaciones nutricionales generales.
          </p>
          <p>
            Finalidad: autenticación, guardado de perfil, historial de marcas, analítica de uso, mejora del servicio, ranking anónimo y personalización de entrenamiento/nutrición.
          </p>
          <p>
            Servicios usados: Firebase Authentication, Firebase Firestore, Firebase Analytics, Vercel Web Analytics y Google AdSense cuando esté configurado.
          </p>
          <p>
            Cookies: se utilizan cookies técnicas, analíticas y publicitarias. Puedes aceptar o rechazar las no necesarias desde el aviso de cookies. El bloqueo del navegador puede limitar anuncios o medición.
          </p>
          <p>
            Derechos: puedes solicitar acceso, rectificación o eliminación escribiendo a <strong>oposicionfisica@gmail.com</strong>. También puedes borrar marcas desde tu perfil.
          </p>
        </div>
      </SectionCard>

      <SectionCard title="Aviso sanitario" subtitle="Entrenamiento y nutrición">
        <p className="text-sm leading-relaxed text-slate-700">
          Las recomendaciones son educativas y generales. Si tienes lesión, patología, medicación, alergias, embarazo, trastorno alimentario o dolor persistente, consulta con profesionales sanitarios antes de seguir cualquier plan.
        </p>
      </SectionCard>
    </div>
  )
}

export default PrivacidadCookiesPage
