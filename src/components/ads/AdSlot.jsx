import { useEffect, useState } from 'react'

const ADSENSE_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT || 'ca-pub-XXXXXXXXXXXXXXXX'

function AdSlot({ slot = '0000000000', format = 'auto', layout = 'display', className = '' }) {
  const [accepted, setAccepted] = useState(() => {
    try {
      return window.localStorage.getItem('cookie-consent-v1') === 'accepted'
    } catch {
      return false
    }
  })

  useEffect(() => {
    const update = () => {
      try {
        setAccepted(window.localStorage.getItem('cookie-consent-v1') === 'accepted')
      } catch {
        setAccepted(false)
      }
    }
    window.addEventListener('cookie-consent-updated', update)
    return () => window.removeEventListener('cookie-consent-updated', update)
  }, [])

  useEffect(() => {
    if (!accepted || ADSENSE_CLIENT.includes('XXXX')) return
    let script = document.querySelector('script[data-adsense-loader]')
    if (!script) {
      script = document.createElement('script')
      script.async = true
      script.crossOrigin = 'anonymous'
      script.dataset.adsenseLoader = 'true'
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`
      document.head.appendChild(script)
    }
    const pushAd = () => {
      try {
        window.adsbygoogle = window.adsbygoogle || []
        window.adsbygoogle.push({})
      } catch {
        // AdSense may be blocked or unavailable before the publisher is approved.
      }
    }
    script.addEventListener('load', pushAd, { once: true })
    if (window.adsbygoogle) pushAd()
    return () => script.removeEventListener('load', pushAd)
  }, [accepted])

  return (
    <aside className={`rounded-3xl border border-slate-200 bg-white p-3 text-center shadow-card ${className}`}>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Publicidad</p>
        {accepted && !ADSENSE_CLIENT.includes('XXXX') ? <ins
        className="adsbygoogle block min-h-24"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-ad-layout={layout}
        data-full-width-responsive="true"
        /> : <p className="py-4 text-xs text-slate-400">Espacio publicitario</p>}
    </aside>
  )
}

export default AdSlot
