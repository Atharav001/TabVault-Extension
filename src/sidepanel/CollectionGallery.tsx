import { useState, useMemo, useEffect } from 'react'
import { useVaultStore } from '../store/useVaultStore'
import type { VaultItem } from '../db/vaultDB'

const FOLDER_NAMES_KEY = 'dateFolderNames'

function formatDate(ts: number): string {
  const date = new Date(ts)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  ) return 'Today'
  if (
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()
  ) return 'Yesterday'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function dateKey(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function FaviconPreview({ item }: { item: VaultItem }) {
  const [src, setSrc] = useState<string | null>(item.favicon || null)
  const [fallbackIdx, setFallbackIdx] = useState(item.favicon ? 0 : item.faviconFallback ? 1 : 2)

  function nextFallback() {
    if (fallbackIdx === 0 && item.faviconFallback) {
      setSrc(item.faviconFallback)
      setFallbackIdx(1)
    } else {
      setSrc(null)
      setFallbackIdx(2)
    }
  }

  if (fallbackIdx === 2 || !src) {
    return (
      <div className="size-4 rounded flex items-center justify-center bg-zinc-800/30 text-[7px] font-bold text-zinc-500">
        {(item.title || '?').charAt(0).toUpperCase()}
      </div>
    )
  }
  return (
    <img src={src} alt="" className="size-4 rounded" onError={nextFallback} />
  )
}

interface DateGroup {
  key: string
  label: string
  count: number
  previews: VaultItem[]
  customName: string
}

export default function CollectionGallery({ onSelectDate }: { onSelectDate: (dateKey: string) => void }) {
  const items = useVaultStore((s) => s.items)
  const theme = useVaultStore((s) => s.theme)
  const isLight = theme === 'light'

  const [folderNames, setFolderNames] = useState<Record<string, string>>({})
  const [renaming, setRenaming] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  useEffect(() => {
    chrome.storage.local.get(FOLDER_NAMES_KEY, (r) => {
      if (r[FOLDER_NAMES_KEY]) setFolderNames(r[FOLDER_NAMES_KEY])
    })
  }, [])

  async function saveFolderName(key: string, name: string) {
    const updated = { ...folderNames, [key]: name }
    setFolderNames(updated)
    await chrome.storage.local.set({ [FOLDER_NAMES_KEY]: updated })
  }

  const groups = useMemo(() => {
    const map = new Map<string, VaultItem[]>()
    for (const item of items) {
      const k = dateKey(item.createdAt)
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(item)
    }
    const result: DateGroup[] = []
    for (const [key, groupItems] of map) {
      groupItems.sort((a, b) => b.createdAt - a.createdAt)
      result.push({
        key,
        label: formatDate(groupItems[0].createdAt),
        count: groupItems.length,
        previews: groupItems.slice(0, 6),
        customName: folderNames[key] || '',
      })
    }
    result.sort((a, b) => {
      const aDate = new Date(a.key).getTime()
      const bDate = new Date(b.key).getTime()
      return bDate - aDate
    })
    return result
  }, [items, folderNames])

  const text = isLight ? 'text-zinc-800' : 'text-zinc-100'
  const subtext = isLight ? 'text-zinc-500' : 'text-zinc-400'
  const cardBg = isLight
    ? 'bg-white/60 border-black/5 hover:bg-white/80 hover:shadow-md shadow-sm shadow-zinc-300/30'
    : 'bg-zinc-900/60 border-white/10 hover:bg-zinc-900/80 hover:shadow-md'

  function startRename(key: string, current: string) {
    setRenaming(key)
    setRenameValue(current)
  }

  async function finishRename(key: string) {
    const val = renameValue.trim()
    if (val) await saveFolderName(key, val)
    setRenaming(null)
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-none px-3 py-3" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
      <div className="grid grid-cols-2 gap-2">
        {groups.map(({ key, label, count, previews, customName }) => {
          const displayName = customName || label
          return (
            <button
              key={key}
              onClick={() => { if (renaming !== key) onSelectDate(key) }}
              className={`flex flex-col items-start gap-2 p-3 rounded-xl border text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${cardBg}`}
            >
              <div className="flex items-center gap-2 w-full min-w-0">
                {renaming === key ? (
                  <input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => finishRename(key)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') finishRename(key)
                      if (e.key === 'Escape') setRenaming(null)
                    }}
                    className={`flex-1 min-w-0 bg-transparent text-sm font-medium outline-none border-b border-indigo-500/50 ${text}`}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    className={`text-sm font-medium truncate flex-1 ${text} group-hover:underline`}
                    onDoubleClick={(e) => { e.stopPropagation(); startRename(key, displayName) }}
                    title="Double-click to rename"
                  >
                    {displayName}
                  </span>
                )}
                <span className={`text-[10px] shrink-0 ${subtext}`}>{count}</span>
              </div>
              {!customName && (
                <span className={`text-[9px] ${subtext}`}>{label}</span>
              )}
              {count > 0 && (
                <div className="flex flex-wrap gap-1">
                  {previews.map((p) => (
                    <FaviconPreview key={p.id} item={p} />
                  ))}
                  {count > 6 && (
                    <span className={`text-[9px] self-center ${subtext}`}>+{count - 6}</span>
                  )}
                </div>
              )}
            </button>
          )
        })}
        {groups.length === 0 && (
          <div className={`col-span-2 text-center py-8 text-sm ${subtext}`}>No tabs yet</div>
        )}
      </div>
    </div>
  )
}
