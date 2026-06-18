import { useEffect, useMemo, useState, useCallback } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { useVaultStore } from '../store/useVaultStore'
import { vaultDB } from '../db/vaultDB'
import { exportToMarkdown } from '../lib/export'
import { restoreTab } from '../lib/restore'
import SearchBar from './SearchBar'
import Collections from './Collections'
import VirtualList from './VirtualList'
import EmptyState from './EmptyState'
import Toast from './Toast'

function IconSend() {
  return (
    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
    </svg>
  )
}

function IconSnapshot() {
  return (
    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  )
}

export default function Panel() {
  const items = useVaultStore((s) => s.items)
  const searchQuery = useVaultStore((s) => s.searchQuery)
  const selectedCollection = useVaultStore((s) => s.selectedCollection)
  const viewMode = useVaultStore((s) => s.viewMode)
  const fetchItems = useVaultStore((s) => s.fetchItems)
  const moveToCollection = useVaultStore((s) => s.moveToCollection)
  const selectedIds = useVaultStore((s) => s.selectedIds)
  const selectAll = useVaultStore((s) => s.selectAll)
  const clearSelection = useVaultStore((s) => s.clearSelection)
  const bulkDelete = useVaultStore((s) => s.bulkDelete)
  const bulkMoveToCollection = useVaultStore((s) => s.bulkMoveToCollection)
  const theme = useVaultStore((s) => s.theme)
  const collections = useVaultStore((s) => s.collections)
  const showToast = useVaultStore((s) => s.showToast)

  const [restoring, setRestoring] = useState(false)
  const [sendingTab, setSendingTab] = useState(false)
  const [showMoveMenu, setShowMoveMenu] = useState(false)
  const [snapshotting, setSnapshotting] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  useEffect(() => {
    fetchItems()
    chrome.storage.local.get('theme', (r) => {
      if (r.theme) useVaultStore.getState().setTheme(r.theme)
    })
  }, [fetchItems])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('light', theme === 'light')
    root.style.backgroundColor = theme === 'light' ? '#f5f5f5' : '#121212'
    root.style.color = theme === 'light' ? '#18181b' : '#e4e4e7'
  }, [theme])

  useEffect(() => {
    function handler(e: MessageEvent) {
      if (e.data?.type === 'TABS_ARCHIVED') {
        showToast(`Archived ${e.data.count} tabs`, e.data.ids)
        fetchItems()
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [showToast, fetchItems])

  const filtered = useMemo(() => {
    let result = items
    if (selectedCollection) {
      result = result.filter((i) => i.collection === selectedCollection)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.url.toLowerCase().includes(q) ||
          i.textPreview.toLowerCase().includes(q) ||
          i.tags.some((t) => t.toLowerCase().includes(q)),
      )
    }
    return result.sort((a, b) => b.createdAt - a.createdAt)
  }, [items, searchQuery, selectedCollection])

  const hasFilter = !!(searchQuery || selectedCollection)

  useEffect(() => {
    if (selectedIds.length > 0) setShowMoveMenu(false)
  }, [selectedIds.length])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
    const ids = useVaultStore.getState().selectedIds
    if (ids.length === 0) return
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      useVaultStore.getState().bulkDelete()
    } else if (e.key === 'r' || e.key === 'R') {
      e.preventDefault()
      ids.forEach((id) => restoreTab(id))
      vaultDB.vault_items.bulkDelete(ids).then(() => {
        useVaultStore.getState().fetchItems()
        chrome.runtime.sendMessage({ type: 'UPDATE_BADGE' })
      })
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    document.addEventListener('keydown', handleKeyDown, { signal: controller.signal })
    return () => controller.abort()
  }, [handleKeyDown])

  useEffect(() => {
    const controller = new AbortController()
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'a' && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault()
        const f = useVaultStore.getState().items.filter((i) => {
          const q = useVaultStore.getState().searchQuery.toLowerCase()
          const coll = useVaultStore.getState().selectedCollection
          if (coll && i.collection !== coll) return false
          if (q && !i.title.toLowerCase().includes(q) && !i.url.toLowerCase().includes(q) &&
              !i.textPreview.toLowerCase().includes(q) && !i.tags.some((t) => t.toLowerCase().includes(q))) return false
          return true
        })
        const ids = f.map((i) => i.id!).filter(Boolean)
        selectAll(ids)
      }
    }
    document.addEventListener('keydown', handler, { signal: controller.signal })
    return () => controller.abort()
  }, [selectAll])

  async function sendCurrentTab() {
    setSendingTab(true)
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab?.id) {
      chrome.runtime.sendMessage({ type: 'ARCHIVE_TAB', tabId: tab.id })
    }
    setTimeout(() => setSendingTab(false), 1000)
  }

  async function snapshotToday() {
    setSnapshotting(true)
    const tabs = await chrome.tabs.query({ currentWindow: true, pinned: false })
    const unpinned = tabs.filter(t => !t.pinned && t.id && t.url && !t.url.startsWith('chrome://') && !t.url.startsWith('brave://') && !t.url.startsWith('about:'))
    const tabIds = unpinned.map(t => t.id!).filter(Boolean)
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    const collection = `Session: ${dateStr}`
    const ids = await chrome.runtime.sendMessage({ type: 'ARCHIVE_TABS_BATCH', tabIds, collection })
    if (ids && ids.length > 0) {
      showToast(`Snapshot: ${ids.length} tabs saved`, ids)
      fetchItems()
    }
    setSnapshotting(false)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || !active) return
    const itemId = Number(active.id)
    const collection = over.id as string
    if (itemId && collection) {
      moveToCollection(itemId, collection)
    }
  }

  const bg = theme === 'light' ? 'bg-[#f5f5f5]' : 'bg-[#121212]'
  const text = theme === 'light' ? 'text-zinc-800' : 'text-zinc-100'
  const subtext = theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'
  const border = theme === 'light' ? 'border-zinc-200/60' : 'border-zinc-800/40'

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className={`flex flex-col h-screen ${bg} ${text} overflow-hidden relative`}>
        <div className="relative bg-gradient-to-b from-zinc-900/20 to-transparent">
          <SearchBar />
          <div className="flex items-center justify-between px-3 pb-1">
            <Collections />
            <div className="flex items-center gap-1.5">
              <button
                onClick={snapshotToday}
                disabled={snapshotting}
                className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-amber-500/20 hover:border-amber-500/40 transition-colors disabled:opacity-40"
                title="Snapshot all tabs in current window"
              >
                <IconSnapshot />
                {snapshotting ? 'Snap...' : 'Snapshot Today'}
              </button>
              <button
                onClick={sendCurrentTab}
                disabled={sendingTab}
                className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 hover:text-violet-300 border border-violet-500/20 hover:border-violet-500/40 transition-colors disabled:opacity-40"
                title="Send current tab to vault"
              >
                <IconSend />
                {sendingTab ? 'Sent' : 'Current Tab'}
              </button>
            </div>
          </div>
          <button
            onClick={() => window.close()}
            className="absolute top-2 right-2 size-6 flex items-center justify-center rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/60 backdrop-blur-sm transition-colors border border-transparent hover:border-zinc-700/50"
            title="Close panel"
          >
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {filtered.length === 0 ? (
          <EmptyState hasFilter={hasFilter} />
        ) : (
          <VirtualList items={filtered} viewMode={viewMode} />
        )}

        {selectedIds.length > 0 ? (
          <div className={`shrink-0 border-t ${border} px-3 py-2.5 bg-gradient-to-t from-zinc-900/40 to-transparent backdrop-blur-sm`}>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium ${subtext} mr-auto`}>
                {selectedIds.length} selected
              </span>
              <div className="relative">
                <button
                  onClick={() => setShowMoveMenu(!showMoveMenu)}
                  className="px-2.5 py-1.5 rounded-xl text-[11px] font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-amber-500/20 hover:border-amber-500/40 transition-colors"
                >
                  Move to
                </button>
                {showMoveMenu && (
                  <div className="absolute bottom-full mb-1 right-0 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/60 rounded-xl py-1 shadow-xl max-h-48 overflow-y-auto min-w-[120px]">
                    {Object.keys(collections).map((name) => (
                      <button
                        key={name}
                        onClick={() => { bulkMoveToCollection(name); setShowMoveMenu(false) }}
                        className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800/60 transition-colors"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={bulkDelete}
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 transition-colors"
              >
                Delete ({selectedIds.length})
              </button>
              <button
                onClick={clearSelection}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-medium bg-zinc-800/30 hover:bg-zinc-800/50 ${subtext} hover:text-zinc-300 border border-zinc-800/50 hover:border-zinc-700/50 transition-colors`}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className={`shrink-0 border-t ${border} px-3 py-2 bg-gradient-to-t from-zinc-900/30 to-transparent backdrop-blur-sm space-y-1.5`}>
            <button
              onClick={async () => {
                setRestoring(true)
                const sorted = [...filtered].sort((a, b) => a.tabIndex - b.tabIndex)
                const idsToRemove: number[] = []
                for (const item of sorted) {
                  if (item.id) {
                    await restoreTab(item.id)
                    idsToRemove.push(item.id)
                  }
                }
                await vaultDB.vault_items.bulkDelete(idsToRemove)
                await fetchItems()
                setRestoring(false)
              }}
              disabled={restoring || filtered.length === 0}
              className="w-full py-2 rounded-xl text-xs font-medium text-emerald-600 hover:text-emerald-300 hover:bg-zinc-800/40 backdrop-blur-sm transition-colors border border-transparent hover:border-emerald-800/60 disabled:opacity-30"
            >
              {restoring ? 'Restoring...' : `Restore All (${filtered.length})`}
            </button>
            <button
              onClick={exportToMarkdown}
              className="w-full py-1.5 rounded-xl text-[11px] font-medium text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/40 backdrop-blur-sm transition-colors border border-transparent hover:border-zinc-800/60"
            >
              Export to Markdown
            </button>
          </div>
        )}

        <Toast />
      </div>
    </DndContext>
  )
}
