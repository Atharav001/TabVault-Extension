import { useVaultStore } from '../store/useVaultStore'

export default function Toast() {
  const toast = useVaultStore((s) => s.toast)
  const undoArchive = useVaultStore((s) => s.undoArchive)
  const clearToast = useVaultStore((s) => s.clearToast)
  const theme = useVaultStore((s) => s.theme)
  const isLight = theme === 'light'

  if (!toast) return null

  return (
    <div className="absolute bottom-4 left-4 right-4 z-50 animate-slide-up">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-xl ${isLight ? 'bg-white/80 border-black/5 shadow-zinc-300/30' : 'bg-zinc-900/80 border-white/10'}`}>
        <span className={`text-sm flex-1 ${isLight ? 'text-zinc-700' : 'text-zinc-200'}`}>{toast.message}</span>
        <button
          onClick={undoArchive}
          className="text-sm font-semibold text-indigo-500 hover:text-indigo-600 transition-colors"
        >
          Undo
        </button>
        <button
          onClick={clearToast}
          className={`transition-colors ${isLight ? 'text-zinc-400 hover:text-zinc-600' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
