import { useState, useEffect } from 'react'

async function getCurrentWindowId(): Promise<number> {
  const win = await chrome.windows.getCurrent()
  return win.id ?? 0
}

function IconSend() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
    </svg>
  )
}

function IconSendAll() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6h16.5M3.75 12h16.5M3.75 18h16.5" />
    </svg>
  )
}

function IconGrid() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
    </svg>
  )
}

function IconGear() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )
}

export default function Popup() {
  const [sending, setSending] = useState<'idle' | 'sending' | 'done'>('idle')
  const [status, setStatus] = useState('')
  const [enabled, setEnabled] = useState(true)

  async function sendCurrentTab() {
    setSending('sending')
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab?.id) {
      chrome.runtime.sendMessage({ type: 'ARCHIVE_TAB', tabId: tab.id })
      setStatus('Sent to vault')
    }
    setSending('done')
    setTimeout(() => { setSending('idle'); setStatus('') }, 1500)
  }

  async function sendAllTabs() {
    setSending('sending')
    const tabs = await chrome.tabs.query({ currentWindow: true, pinned: false })
    const nonPinned = tabs.filter(t => !t.pinned)
    for (const tab of nonPinned) {
      if (tab.id) chrome.runtime.sendMessage({ type: 'ARCHIVE_TAB', tabId: tab.id })
    }
    setStatus(`Sent ${nonPinned.length} tabs to vault`)
    setSending('done')
    setTimeout(() => { setSending('idle'); setStatus('') }, 2000)
  }

  useEffect(() => {
    chrome.storage.local.get('extensionEnabled', (r) => {
      setEnabled(r.extensionEnabled !== false)
    })
  }, [])

  async function toggleEnabled() {
    const next = !enabled
    setEnabled(next)
    await chrome.storage.local.set({ extensionEnabled: next })
    setStatus(next ? 'Extension enabled' : 'Extension disabled')
    setTimeout(() => setStatus(''), 1500)
  }

  async function openSidePanel() {
    const windowId = await getCurrentWindowId()
    chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL', windowId })
  }

  async function openSettings() {
    const windowId = await getCurrentWindowId()
    await chrome.storage.local.set({ sidePanelRoute: 'settings' })
    chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL', windowId })
  }

  const baseBtn =
    'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border backdrop-blur-sm'

  return (
    <div className="flex flex-col gap-1.5 p-2.5 bg-[#121212] text-zinc-100">
      <div className="flex items-center justify-between px-1 pb-1.5">
        <div className="flex items-center gap-2">
          <div className={`size-2 rounded-full shadow-sm ${enabled ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-zinc-600'}`} />
          <span className="text-xs font-semibold text-zinc-400 tracking-wide">TabVault</span>
        </div>
        <button
          onClick={toggleEnabled}
          className={`flex items-center w-9 h-5 rounded-full p-0.5 transition-colors ${enabled ? 'bg-emerald-500/60 justify-end' : 'bg-zinc-700 justify-start'}`}
          title={enabled ? 'Disable extension' : 'Enable extension'}
        >
          <span className="size-4 rounded-full bg-white transition-all" />
        </button>
      </div>

      <button
        onClick={sendCurrentTab}
        disabled={sending === 'sending'}
        className={`${baseBtn} bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border-violet-500/20 hover:border-violet-500/40 disabled:opacity-40`}
      >
        <IconSend />
        Send Current Tab to Vault
      </button>

      <button
        onClick={sendAllTabs}
        disabled={sending === 'sending'}
        className={`${baseBtn} bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border-blue-500/20 hover:border-blue-500/40 disabled:opacity-40`}
      >
        <IconSendAll />
        Send All Tabs to Vault
      </button>

      <div className="border-t border-zinc-800/40 my-1" />

      <button
        onClick={openSidePanel}
        className={`${baseBtn} bg-zinc-800/30 hover:bg-zinc-800/50 text-zinc-300 border-zinc-800/50 hover:border-zinc-700/50`}
      >
        <IconGrid />
        Open Side Panel View
      </button>

      <button
        onClick={openSettings}
        className={`${baseBtn} bg-zinc-800/30 hover:bg-zinc-800/50 text-zinc-300 border-zinc-800/50 hover:border-zinc-700/50`}
      >
        <IconGear />
        Settings
      </button>

      {status && (
        <div className="text-[11px] text-zinc-500 text-center pt-0.5 pb-1 backdrop-blur-sm">{status}</div>
      )}
    </div>
  )
}
