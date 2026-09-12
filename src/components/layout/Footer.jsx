function Footer({ onNavigate }) {
  return (
    <footer className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-card">
      <p className="font-extrabold text-brand-900">App Opositor Policía</p>
      <p className="mt-2">
        Herramienta educativa para planificar entrenamiento, registrar marcas y consultar orientación deportiva general.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="font-bold text-brand-700" onClick={() => onNavigate('sobre')}>
          Sobre nosotros
        </button>
        <span>·</span>
        <button type="button" className="font-bold text-brand-700" onClick={() => onNavigate('guia')}>
          Cómo funciona
        </button>
        <span>·</span>
        <button type="button" className="font-bold text-brand-700" onClick={() => onNavigate('privacidad')}>
          Privacidad y cookies
        </button>
      </div>
    </footer>
  )
}

export default Footer
