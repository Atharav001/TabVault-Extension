import { useVaultStore } from '../store/useVaultStore'

export default function Toast() {
  const toast = useVaultStore((s) => s.toast)
  const undoArchive = useVaultStore((s) => s.undoArchive)
  const clearToast = useVaultStore((s) => s.clearToast)

  if (!toast) return null

  return (
    <div className="absolute bottom-4 left-4 right-4 z-50 animate-slide-up">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/60 shadow-2xl">
        <span className="text-sm text-zinc-200 flex-1">{toast.message}</span>
        <button
          onClick={undoArchive}
          className="text-sm font-semibold text-violet-400 hover:text-violet-300 transition-colors"
        >
          Undo
        </button>
        <button
          onClick={clearToast}
          className="text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
