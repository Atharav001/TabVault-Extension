import { useVaultStore } from '../../store/useVaultStore'

export default function ArchiveToast() {
  const pending = useVaultStore((s) => s.pendingAutoArchive)
  const archivePendingTabs = useVaultStore((s) => s.archivePendingTabs)
  const snoozePendingTabs = useVaultStore((s) => s.snoozePendingTabs)
  const dismissPendingTabs = useVaultStore((s) => s.dismissPendingTabs)
  const theme = useVaultStore((s) => s.theme)
  const isLight = theme === 'light'

  if (pending.length === 0) return null

  const count = pending.length

  return (
    <div className="shrink-0 animate-slide-down">
      <div className={`mx-2 my-1 px-3 py-2.5 rounded-xl border shadow-lg backdrop-blur-md ${isLight ? 'bg-amber-50/95 border-amber-200/60' : 'bg-zinc-900/95 border-zinc-700/60'}`}>
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
            <svg className={`size-4 ${isLight ? 'text-amber-500' : 'text-amber-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${isLight ? 'text-amber-800' : 'text-amber-200'}`}>
              {count} {count === 1 ? 'tab has' : 'tabs have'} been inactive
            </p>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-amber-600/80' : 'text-amber-400/70'}`}>
              Archive them to save RAM?
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={archivePendingTabs}
              className={`px-3 py-1.5 rounded-full text-[11px] font-medium border shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 ${isLight ? 'bg-zinc-900 text-white hover:bg-zinc-800 border-zinc-900' : 'bg-zinc-100 text-black hover:bg-zinc-200 border-zinc-100'}`}
            >
              Vault Now
            </button>
            <button
              onClick={snoozePendingTabs}
              className={`px-3 py-1.5 rounded-full text-[11px] font-medium border shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 ${isLight ? 'bg-white text-zinc-600 hover:bg-zinc-50 border-zinc-200' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border-zinc-800'}`}
            >
              Snooze 1hr
            </button>
            <button
              onClick={dismissPendingTabs}
              className={`p-1.5 rounded-full transition-all duration-200 hover:scale-110 active:scale-90 ${isLight ? 'text-amber-400 hover:text-amber-600 hover:bg-amber-100/50' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}
              title="No, skip 3 hours"
            >
              <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
