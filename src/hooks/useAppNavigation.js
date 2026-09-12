import { useState } from 'react'
import { navigationTabs } from '../utils/constants'

export function useAppNavigation() {
  const [currentTab, setCurrentTab] = useState('inicio')

  return {
    currentTab,
    tabs: navigationTabs,
    changeTab: setCurrentTab,
  }
}
