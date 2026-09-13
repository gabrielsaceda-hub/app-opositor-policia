import { useEffect, useState } from 'react'
import { navigationTabs } from '../utils/constants'

function tabFromPathname(pathname) {
  const segment = pathname.replace(/^\/+|\/+$/g, '')
  if (!segment) return 'inicio'
  return navigationTabs.some((tab) => tab.id === segment) ? segment : 'inicio'
}

function pathForTab(tab) {
  return tab === 'inicio' ? '/' : `/${tab}`
}

export function useAppNavigation() {
  const [currentTab, setCurrentTab] = useState(() => tabFromPathname(window.location.pathname))

  useEffect(() => {
    const handlePopState = () => setCurrentTab(tabFromPathname(window.location.pathname))
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const changeTab = (tab, { replace = false } = {}) => {
    const nextTab = navigationTabs.some((item) => item.id === tab) ? tab : 'inicio'
    const nextPath = pathForTab(nextTab)
    if (window.location.pathname !== nextPath) {
      window.history[replace ? 'replaceState' : 'pushState']({}, '', nextPath)
    }
    setCurrentTab(nextTab)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return {
    currentTab,
    tabs: navigationTabs,
    changeTab,
  }
}
