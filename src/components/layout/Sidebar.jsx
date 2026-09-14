import AdSlot from '../ads/AdSlot'
import { pathForTab } from '../../hooks/useAppNavigation'

function Sidebar({ tabs, currentTab, onChangeTab }) {
  return (
    <aside className="hidden w-72 shrink-0 space-y-4 lg:block">
      <nav className="rounded-3xl border border-slate-200 bg-white p-3 shadow-card" aria-label="Navegación secundaria">
        <p className="px-3 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Secciones</p>
        <div className="space-y-2">
          {tabs.map((tab) => {
            const active = tab.id === currentTab
            return (
              <a
                key={tab.id}
                href={pathForTab(tab.id)}
                className={`block w-full rounded-2xl px-4 py-3 text-left text-sm font-bold transition ${
                  active ? 'bg-brand-600 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
                onClick={(e) => {
                  e.preventDefault()
                  onChangeTab(tab.id)
                }}
              >
                {tab.label}
              </a>
            )
          })}
        </div>
      </nav>

      <AdSlot slot={import.meta.env.VITE_ADSENSE_SLOT_SIDEBAR || '3333333333'} className="sticky top-28" />
    </aside>
  )
}

export default Sidebar
