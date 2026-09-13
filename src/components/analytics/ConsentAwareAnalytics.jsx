import { useEffect, useState } from 'react'
import { Analytics } from '@vercel/analytics/react'

function hasConsent() {
  try {
    return window.localStorage.getItem('cookie-consent-v1') === 'accepted'
  } catch {
    return false
  }
}

function ConsentAwareAnalytics() {
  const [accepted, setAccepted] = useState(hasConsent)

  useEffect(() => {
    const update = () => setAccepted(hasConsent())
    window.addEventListener('cookie-consent-updated', update)
    return () => window.removeEventListener('cookie-consent-updated', update)
  }, [])

  return accepted ? <Analytics /> : null
}

export default ConsentAwareAnalytics
