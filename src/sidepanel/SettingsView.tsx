import { exportToMarkdown } from '../lib/export'

export default function SettingsView({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col h-screen bg-[#121212] text-zinc-100">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/50 bg-gradient-to-b from-zinc-900/30 to-transparent backdrop-blur-sm">
        <button onClick={onBack} className="size-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors">
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </button>
        <h1 className="text-base font-semibold">Settings</h1>
      </div>

      <div className="flex-1 p-4 space-y-3">
        <div className="rounded-xl bg-zinc-900/50 backdrop-blur-xl p-4 border border-zinc-800/40">
          <h2 className="text-sm font-medium text-zinc-200 mb-1">Keyboard Shortcut</h2>
          <p className="text-xs text-zinc-500">
            Press <kbd className="px-1.5 py-0.5 rounded-md bg-zinc-800/80 text-zinc-300 text-xs border border-zinc-700/50">Ctrl+Shift+V</kbd> (<kbd className="px-1.5 py-0.5 rounded-md bg-zinc-800/80 text-zinc-300 text-xs border border-zinc-700/50">⌘+Shift+V</kbd> on Mac) to open the side panel.
          </p>
        </div>

        <div className="rounded-xl bg-zinc-900/50 backdrop-blur-xl p-4 border border-zinc-800/40">
          <h2 className="text-sm font-medium text-zinc-200 mb-2">Data</h2>
          <button
            onClick={exportToMarkdown}
            className="px-4 py-2 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 text-sm font-medium transition-colors border border-violet-500/20 hover:border-violet-500/40"
          >
            Export to Markdown
          </button>
        </div>
      </div>
    </div>
  )
}
