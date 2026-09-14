import { pathForTab } from '../../hooks/useAppNavigation'

function Footer({ onNavigate }) {
  const links = [
    { id: 'sobre', label: 'Sobre nosotros' },
    { id: 'guia', label: 'Cómo funciona' },
    { id: 'calculadora', label: 'Calculadora de baremos' },
    { id: 'ritmo', label: 'Calculadora de ritmos' },
    { id: 'privacidad', label: 'Privacidad y cookies' },
  ]
  return (
    <footer className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-card">
      <p className="font-extrabold text-brand-900">App Opositor Policía</p>
      <p className="mt-2">
        Herramienta educativa para planificar entrenamiento, registrar marcas y consultar orientación deportiva general.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {links.map((link, index) => (
          <span key={link.id} className="flex items-center gap-2">
            {index > 0 ? <span aria-hidden="true">·</span> : null}
            <a
              href={pathForTab(link.id)}
              className="font-bold text-brand-700"
              onClick={(e) => {
                e.preventDefault()
                onNavigate(link.id)
              }}
            >
              {link.label}
            </a>
          </span>
        ))}
      </div>
    </footer>
  )
}

export default Footer
