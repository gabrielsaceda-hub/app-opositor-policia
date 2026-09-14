import { pathForTab } from '../../hooks/useAppNavigation'

function BottomNav({ tabs, currentTab, onChangeTab }) {
  return (
    <nav className="sticky bottom-0 z-20 flex gap-2 overflow-x-auto border-t border-slate-200 bg-white px-3 py-3 lg:hidden" aria-label="Navegación principal">
      {tabs.map((tab) => {
        const active = tab.id === currentTab

        return (
          <a
            key={tab.id}
            href={pathForTab(tab.id)}
            onClick={(e) => {
              e.preventDefault()
              onChangeTab(tab.id)
            }}
            className={`shrink-0 rounded-2xl px-3 py-3 text-xs font-semibold transition sm:text-sm ${
              active
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                : 'bg-slate-100 text-slate-700 active:bg-slate-200'
            }`}
          >
            {tab.label}
          </a>
        )
      })}
    </nav>
  )
}

export default BottomNav
