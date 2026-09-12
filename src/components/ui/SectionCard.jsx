function SectionCard({ title, subtitle, children }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
      <header className="mb-4">
        <h2 className="text-lg font-extrabold text-brand-900">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
      </header>
      {children}
    </article>
  )
}

export default SectionCard
