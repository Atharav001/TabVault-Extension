import { useState } from 'react'
import { useVaultStore } from '../../store/useVaultStore'

export default function ArchiveToast() {
  const pending = useVaultStore((s) => s.pendingAutoArchive)
  const archivePendingTabs = useVaultStore((s) => s.archivePendingTabs)
  const snoozePendingTabs = useVaultStore((s) => s.snoozePendingTabs)
  const dismissPendingTabs = useVaultStore((s) => s.dismissPendingTabs)
  const theme = useVaultStore((s) => s.theme)
  const isLight = theme === 'light'

  const [expanded, setExpanded] = useState(false)
  const [checked, setChecked] = useState<Record<number, boolean>>({})

  if (pending.length === 0) return null

  const count = pending.length
  const allChecked = pending.every((t) => checked[t.tabId] !== false)

  function toggleAll() {
    if (allChecked) {
      setChecked(Object.fromEntries(pending.map((t) => [t.tabId, false])))
    } else {
      setChecked(Object.fromEntries(pending.map((t) => [t.tabId, true])))
    }
  }

  function toggleOne(tabId: number) {
    setChecked((prev) => ({ ...prev, [tabId]: prev[tabId] === false ? true : false }))
  }

  async function archiveSelected() {
    const archiveIds = pending.filter((t) => checked[t.tabId] !== false).map((t) => t.tabId)
    const snoozeIds = pending.filter((t) => checked[t.tabId] === false).map((t) => t.tabId)
    if (archiveIds.length === 0 && snoozeIds.length === 0) return
    try {
      if (archiveIds.length > 0) {
        const res = await chrome.runtime.sendMessage({ type: 'ARCHIVE_SELECTED', archiveIds, snoozeIds })
        if (res) {
          useVaultStore.getState().setPendingAutoArchive([])
          setExpanded(false)
        }
      } else {
        const ok = await chrome.runtime.sendMessage({ type: 'SNOOZE_PENDING', tabIds: snoozeIds })
        if (ok) {
          useVaultStore.getState().setPendingAutoArchive([])
          setExpanded(false)
        }
      }
    } catch {
    }
  }

  const textCls = isLight ? 'text-zinc-700' : 'text-zinc-200'
  const subtextCls = isLight ? 'text-zinc-500' : 'text-zinc-400'

  return (
    <div className="shrink-0 animate-slide-down">
      <div className={`mx-2 my-1 rounded-xl border shadow-lg backdrop-blur-xl ${isLight ? 'bg-amber-50/80 border-amber-200/40' : 'bg-zinc-900/70 border-zinc-700/40'}`}>
        <div className="px-3 py-2.5">
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
                onClick={() => { setExpanded(!expanded); if (!expanded) setChecked({}) }}
                className={`px-2.5 py-1.5 rounded-full text-[11px] font-medium border shadow-sm backdrop-blur-xl transition-all duration-200 hover:scale-105 active:scale-95 ${isLight ? 'bg-white/60 text-zinc-600 hover:bg-white/80 border-black/5' : 'bg-zinc-900/60 text-zinc-400 hover:bg-zinc-900/80 border-white/10'}`}
              >
                {expanded ? 'Hide' : 'View Tabs'}
              </button>
              <button
                onClick={archivePendingTabs}
                className={`px-3 py-1.5 rounded-full text-[11px] font-medium border shadow-sm backdrop-blur-xl transition-all duration-200 hover:scale-105 active:scale-95 ${isLight ? 'bg-zinc-900/90 text-white hover:bg-zinc-800/90 border-zinc-900/50' : 'bg-zinc-100/90 text-black hover:bg-zinc-200/90 border-zinc-100/50'}`}
              >
                Vault Now
              </button>
              <button
                onClick={snoozePendingTabs}
                className={`px-3 py-1.5 rounded-full text-[11px] font-medium border shadow-sm backdrop-blur-xl transition-all duration-200 hover:scale-105 active:scale-95 ${isLight ? 'bg-white/60 text-zinc-600 hover:bg-white/80 border-black/5' : 'bg-zinc-900/60 text-zinc-400 hover:bg-zinc-900/80 border-white/10'}`}
              >
                Snooze
              </button>
              <button
                onClick={dismissPendingTabs}
                className={`p-1.5 rounded-full backdrop-blur-xl transition-all duration-200 hover:scale-110 active:scale-90 ${isLight ? 'text-amber-400 hover:text-amber-600 hover:bg-amber-100/50 border-0' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/70 border-0'}`}
                title="No, skip 3 hours"
              >
                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {expanded && (
          <div className={`border-t ${isLight ? 'border-amber-200/30' : 'border-zinc-700/30'}`}>
            <div className="max-h-48 overflow-y-auto scrollbar-none">
              <div className="flex items-center gap-2 px-3 py-1.5 border-b border-zinc-800/20">
                <button
                  onClick={toggleAll}
                  className={`shrink-0 size-4 rounded border flex items-center justify-center transition-colors ${allChecked ? 'bg-indigo-500 border-indigo-500' : isLight ? 'border-zinc-300' : 'border-zinc-600'}`}
                >
                  {allChecked && (
                    <svg className="size-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  )}
                </button>
                <span className={`text-[11px] font-medium ${subtextCls}`}>Select All</span>
              </div>
              {pending.map((tab) => (
                <label
                  key={tab.tabId}
                  className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors ${isLight ? 'hover:bg-amber-50/50' : 'hover:bg-zinc-800/30'}`}
                >
                  <button
                    onClick={() => toggleOne(tab.tabId)}
                    className={`shrink-0 size-4 rounded border flex items-center justify-center transition-colors ${checked[tab.tabId] !== false ? 'bg-indigo-500 border-indigo-500' : isLight ? 'border-zinc-300' : 'border-zinc-600'}`}
                  >
                    {checked[tab.tabId] !== false && (
                      <svg className="size-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    )}
                  </button>
                  <span className={`text-xs truncate flex-1 ${textCls}`}>{tab.title || tab.url || 'Untitled'}</span>
                  <span className={`text-[9px] ${subtextCls}`}>{tab.url ? new URL(tab.url).hostname : ''}</span>
                </label>
              ))}
            </div>
            <div className={`flex items-center gap-2 px-3 py-2 border-t ${isLight ? 'border-amber-200/30' : 'border-zinc-700/30'}`}>
              <button
                onClick={archiveSelected}
                className={`flex-1 py-1.5 rounded-full text-[11px] font-medium border shadow-sm backdrop-blur-xl transition-all duration-200 hover:scale-105 active:scale-95 ${isLight ? 'bg-zinc-900/90 text-white hover:bg-zinc-800/90 border-zinc-900/50' : 'bg-zinc-100/90 text-black hover:bg-zinc-200/90 border-zinc-100/50'}`}
              >
                Archive Selected & Snooze Rest
              </button>
              <button
                onClick={() => setExpanded(false)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-medium border shadow-sm backdrop-blur-xl transition-all duration-200 hover:scale-105 active:scale-95 ${isLight ? 'bg-white/60 text-zinc-600 hover:bg-white/80 border-black/5' : 'bg-zinc-900/60 text-zinc-400 hover:bg-zinc-900/80 border-white/10'}`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
