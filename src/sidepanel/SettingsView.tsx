import { exportToMarkdown } from '../lib/export'
import { useVaultStore } from '../store/useVaultStore'

export default function SettingsView({ onBack }: { onBack: () => void }) {
  const theme = useVaultStore((s) => s.theme)
  const setTheme = useVaultStore((s) => s.setTheme)

  async function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    await chrome.storage.local.set({ theme: next })
  }

  const isLight = theme === 'light'

  const bg = isLight
    ? 'bg-gradient-to-br from-zinc-50/95 via-white/90 to-zinc-100/90'
    : 'bg-[#121212]'
  const text = isLight ? 'text-zinc-700' : 'text-zinc-100'
  const subtext = isLight ? 'text-zinc-400' : 'text-zinc-500'
  const border = isLight ? 'border-zinc-200/50' : 'border-zinc-800/50'
  const headerBorder = isLight ? 'border-zinc-200/50' : 'border-zinc-800/50'
  const cardBg = isLight
    ? 'bg-white/60 backdrop-blur-xl border-zinc-200/50'
    : 'bg-zinc-900/50 backdrop-blur-xl border-zinc-800/40'
  const backBtn = isLight
    ? 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100/50 border-zinc-200/40 hover:border-zinc-300/50'
    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50 border-transparent'
  const kbdBg = isLight
    ? 'bg-zinc-100/80 text-zinc-500 border-zinc-200/60'
    : 'bg-zinc-800/80 text-zinc-300 border-zinc-700/50'

  return (
    <div className={`flex flex-col h-screen ${bg} ${text}`}>
      <div className={`flex items-center gap-3 px-4 py-3 border-b ${headerBorder} bg-gradient-to-b from-white/40 to-transparent backdrop-blur-sm`}>
        <button onClick={onBack} className={`size-7 flex items-center justify-center rounded-lg backdrop-blur-sm transition-colors border ${backBtn}`}>
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </button>
        <h1 className="text-base font-semibold">Settings</h1>
      </div>

      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        <div className={`rounded-xl backdrop-blur-xl p-4 border ${cardBg}`}>
          <h2 className="text-sm font-medium mb-1">Keyboard Shortcut</h2>
          <p className={`text-xs ${subtext}`}>
            Press <kbd className={`px-1.5 py-0.5 rounded-md text-xs border ${kbdBg}`}>Ctrl+Shift+V</kbd> (<kbd className={`px-1.5 py-0.5 rounded-md text-xs border ${kbdBg}`}>⌘+Shift+V</kbd> on Mac) to open the side panel.
          </p>
        </div>

        <div className={`rounded-xl backdrop-blur-xl p-4 border ${cardBg}`}>
          <h2 className="text-sm font-medium mb-2">Appearance</h2>
          <button
            onClick={toggleTheme}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${isLight ? 'bg-zinc-100/60 text-zinc-600 hover:bg-zinc-200/60 border-zinc-200/50' : 'bg-zinc-800/30 hover:bg-zinc-800/50 text-zinc-300 border-zinc-800/50 hover:border-zinc-700/50'}`}
          >
            {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          </button>
        </div>

        <div className={`rounded-xl backdrop-blur-xl p-4 border ${cardBg}`}>
          <h2 className="text-sm font-medium mb-2">Data</h2>
          <button
            onClick={exportToMarkdown}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${isLight ? 'bg-violet-50/60 text-violet-600 hover:bg-violet-100/60 border-violet-200/50' : 'bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border-violet-500/20 hover:border-violet-500/40'}`}
          >
            Export to Markdown
          </button>
        </div>
      </div>
    </div>
  )
}
