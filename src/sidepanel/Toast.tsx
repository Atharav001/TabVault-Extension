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
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl backdrop-blur-xl border shadow-2xl ${isLight ? 'bg-white/80 border-zinc-200/60 shadow-zinc-200/30' : 'bg-zinc-900/95 border-zinc-700/60'}`}>
        <span className={`text-sm flex-1 ${isLight ? 'text-zinc-700' : 'text-zinc-200'}`}>{toast.message}</span>
        <button
          onClick={undoArchive}
          className="text-sm font-semibold text-violet-500 hover:text-violet-600 transition-colors"
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
