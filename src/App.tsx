import { useEffect, useState } from 'react'
import Panel from './sidepanel/Panel'
import SettingsView from './sidepanel/SettingsView'

export default function App() {
  const [route, setRoute] = useState<'vault' | 'settings'>('vault')

  useEffect(() => {
    chrome.storage.local.get('sidePanelRoute', (result) => {
      if (result.sidePanelRoute === 'settings') {
        setRoute('settings')
        chrome.storage.local.remove('sidePanelRoute')
      }
    })
  }, [])

  if (route === 'settings') {
    return <SettingsView onBack={() => setRoute('vault')} />
  }

  return <Panel />
}
