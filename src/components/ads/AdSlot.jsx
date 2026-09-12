import { useEffect } from 'react'

const ADSENSE_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT || 'ca-pub-XXXXXXXXXXXXXXXX'

function AdSlot({ slot = '0000000000', format = 'auto', layout = 'display', className = '' }) {
  useEffect(() => {
    if (!window.adsbygoogle) return
    try {
      window.adsbygoogle.push({})
    } catch {
      // AdSense can throw in development, before approval, or when blocked by consent/ad blockers.
    }
  }, [])

  return (
    <aside className={`rounded-3xl border border-slate-200 bg-white p-3 text-center shadow-card ${className}`}>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Publicidad</p>
      <ins
        className="adsbygoogle block min-h-24"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-ad-layout={layout}
        data-full-width-responsive="true"
      />
    </aside>
  )
}

export default AdSlot
