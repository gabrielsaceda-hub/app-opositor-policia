function Header({ appName, user, isAdmin, onAccountClick }) {
  const isIdentified = user && !user.isAnonymous

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Preparación física</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-brand-900">{appName}</h1>
        </div>
        <button
          type="button"
          className={`shrink-0 rounded-2xl px-3 py-2 text-right text-xs font-bold ${
            isIdentified ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
          }`}
          onClick={onAccountClick}
        >
          <span className="block">{isIdentified ? 'Identificado' : 'Sin registrar'}</span>
          <span className="block max-w-32 truncate font-semibold">
            {isIdentified ? (isAdmin ? 'Admin' : user.email) : 'Perfil'}
          </span>
        </button>
      </div>
    </header>
  )
}

export default Header
