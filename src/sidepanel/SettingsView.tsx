import { exportToMarkdown } from '../lib/export'
import { useVaultStore } from '../store/useVaultStore'
import { useState } from 'react'

export default function SettingsView({ onBack }: { onBack: () => void }) {
  const theme = useVaultStore((s) => s.theme)
  const setTheme = useVaultStore((s) => s.setTheme)
  const [testing, setTesting] = useState(false)

  async function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    await chrome.storage.local.set({ theme: next })
  }

  async function testNotification() {
    setTesting(true)
    await chrome.runtime.sendMessage({ type: 'TEST_PENDING_NOTIFICATION' })
    setTimeout(() => setTesting(false), 2000)
  }

  const isLight = theme === 'light'

  const text = isLight ? 'text-zinc-800' : 'text-zinc-100'
  const subtext = isLight ? 'text-zinc-500' : 'text-zinc-400'
  const border = isLight ? 'border-zinc-200/50' : 'border-zinc-800/40'
  const cardBg = isLight
    ? 'bg-white/60 backdrop-blur-xl border-black/5 shadow-sm shadow-zinc-300/30'
    : 'bg-zinc-900/60 backdrop-blur-xl border-white/10'
  const backBtn = isLight
    ? 'text-zinc-400 hover:text-zinc-600 hover:bg-white/80 border-black/5'
    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80 border-white/10'
  const kbdBg = isLight
    ? 'bg-white/60 text-zinc-500 border-black/5'
    : 'bg-zinc-900/60 text-zinc-300 border-white/10'
  const primaryBtn = isLight
    ? 'bg-zinc-900/90 backdrop-blur-xl text-white hover:bg-zinc-800/90 border-zinc-900/50'
    : 'bg-zinc-100/90 backdrop-blur-xl text-black hover:bg-zinc-200/90 border-zinc-100/50'

  return (
    <div className={`flex flex-col h-screen ${text}`}>
      <div className={`flex items-center gap-3 px-4 py-3 border-b ${border} ${isLight ? 'bg-white/60 backdrop-blur-xl' : 'bg-zinc-950/60 backdrop-blur-xl'}`}>
        <button onClick={onBack} className={`size-7 flex items-center justify-center rounded-lg border transition-colors ${backBtn}`}>
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </button>
        <h1 className="text-base font-semibold">Settings</h1>
      </div>

      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        <div className={`rounded-xl p-4 border ${cardBg}`}>
          <h2 className="text-sm font-medium mb-1">Keyboard Shortcut</h2>
          <p className={`text-xs ${subtext} mb-3`}>
            Current: <kbd className={`px-1.5 py-0.5 rounded-md text-xs border ${kbdBg}`}>{navigator.platform.includes('Mac') ? '⌘+Shift+V' : 'Ctrl+Shift+V'}</kbd>
          </p>
          <button
            onClick={() => chrome.tabs.create({ url: 'chrome://extensions/shortcuts' })}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border shadow-sm backdrop-blur-xl ${isLight ? 'bg-white/60 text-zinc-600 hover:bg-white/80 border-black/5' : 'bg-zinc-900/60 text-zinc-300 hover:bg-zinc-900/80 border-white/10'}`}
          >
            Change Shortcut
          </button>
        </div>

        <div className={`rounded-xl p-4 border ${cardBg}`}>
          <h2 className="text-sm font-medium mb-2">Appearance</h2>
          <button
            onClick={toggleTheme}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border shadow-sm ${primaryBtn}`}
          >
            {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          </button>
        </div>

        <div className={`rounded-xl p-4 border ${cardBg}`}>
          <h2 className="text-sm font-medium mb-2">Data</h2>
          <button
            onClick={exportToMarkdown}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border shadow-sm backdrop-blur-xl ${isLight ? 'bg-white/60 text-indigo-600 hover:bg-white/80 border-black/5' : 'bg-zinc-900/60 text-indigo-400 hover:bg-zinc-900/80 border-white/10'}`}
          >
            Export to Markdown
          </button>
        </div>

        <div className={`rounded-xl p-4 border ${cardBg}`}>
          <h2 className="text-sm font-medium mb-1">Test Notification</h2>
          <p className={`text-xs ${subtext} mb-3`}>
            Simulates a pending auto-archive notification using the current tab. Minimize the window, restore it, or click the result to test the full flow.
          </p>
          <button
            onClick={testNotification}
            disabled={testing}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border shadow-sm backdrop-blur-xl disabled:opacity-40 ${isLight ? 'bg-white/60 text-amber-600 hover:bg-amber-50/80 border-black/5' : 'bg-zinc-900/60 text-amber-400 hover:bg-amber-950/30 border-white/10'}`}
          >
            {testing ? 'Sent...' : 'Trigger Test Notification'}
          </button>
        </div>
      </div>
    </div>
  )
}
