// Tarjetas de métricas en tiempo real de la plataforma.
function MetricsCards({ metrics }) {
  const cards = [
    { label: 'Socios registrados', value: metrics.totalUsers },
    { label: 'Activos hoy', value: metrics.activeToday },
    { label: 'Activos esta semana', value: metrics.activeWeek },
    { label: 'Entrenos totales', value: metrics.totalTrainings },
    { label: 'Strava / Manuales', value: `${metrics.stravaCount} / ${metrics.manualCount}` },
    { label: 'Perfil nutricional completo', value: `${metrics.nutritionPct}%` },
  ]
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
          <p className="text-2xl font-extrabold text-brand-900">{card.value}</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">{card.label}</p>
        </div>
      ))}
    </div>
  )
}

export default MetricsCards
