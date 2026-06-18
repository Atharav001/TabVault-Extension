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
import SettingsView from './SettingsView'
import Toast from './Toast'
import ArchiveToast from './components/ArchiveToast'

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
  const pendingAutoArchive = useVaultStore((s) => s.pendingAutoArchive)
  const setPendingAutoArchive = useVaultStore((s) => s.setPendingAutoArchive)

  const [showSettings, setShowSettings] = useState(false)
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
  }, [theme])

  useEffect(() => {
    function postHandler(e: MessageEvent) {
      if (e.data?.type === 'TABS_ARCHIVED') {
        showToast(`Archived ${e.data.count} tabs`, e.data.ids)
        fetchItems()
      } else if (e.data?.type === 'PENDING_AUTO_ARCHIVE') {
        setPendingAutoArchive(e.data.tabs)
      } else if (e.data?.type === 'PENDING_AUTO_ARCHIVE_REMOVE') {
        const current = useVaultStore.getState().pendingAutoArchive
        const updated = current.filter((t: { tabId: number }) => t.tabId !== e.data.tabId)
        setPendingAutoArchive(updated)
      }
    }
    function runtimeHandler(msg: Record<string, unknown>) {
      if (msg.type === 'TABS_ARCHIVED') {
        showToast(`Archived ${msg.count} tabs`, msg.ids as number[])
        fetchItems()
      } else if (msg.type === 'PENDING_AUTO_ARCHIVE') {
        setPendingAutoArchive(msg.tabs as { tabId: number; title: string; url: string }[])
      } else if (msg.type === 'PENDING_AUTO_ARCHIVE_REMOVE') {
        const current = useVaultStore.getState().pendingAutoArchive
        const updated = current.filter((t) => t.tabId !== (msg.tabId as number))
        setPendingAutoArchive(updated)
      }
    }
    window.addEventListener('message', postHandler)
    chrome.runtime.onMessage.addListener(runtimeHandler)
    return () => {
      window.removeEventListener('message', postHandler)
      chrome.runtime.onMessage.removeListener(runtimeHandler)
    }
  }, [showToast, fetchItems, setPendingAutoArchive])

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

  const isLight = theme === 'light'

  const headerBg = isLight
    ? 'bg-zinc-100/80 backdrop-blur-md border-b border-zinc-200/50'
    : 'bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/40'
  const barBg = isLight
    ? 'bg-zinc-100/80 backdrop-blur-md border-t border-zinc-200/50'
    : 'bg-zinc-950/80 backdrop-blur-md border-t border-zinc-800/40'
  const text = isLight ? 'text-zinc-800' : 'text-zinc-100'
  const subtext = isLight ? 'text-zinc-500' : 'text-zinc-400'
  const border = isLight ? 'border-zinc-200/50' : 'border-zinc-800/40'

  const btnHover = 'transition-all duration-200 hover:scale-105 active:scale-95'

  const primaryBtn = isLight
    ? `bg-zinc-900 text-white hover:bg-zinc-800 border-zinc-900 shadow-sm ${btnHover}`
    : `bg-zinc-100 text-black hover:bg-zinc-200 border-zinc-100 shadow-sm ${btnHover}`
  const secondaryBtn = isLight
    ? `bg-white text-zinc-600 hover:text-zinc-800 hover:bg-zinc-50 border-zinc-200 shadow-sm ${btnHover}`
    : `bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border-zinc-800 shadow-sm ${btnHover}`
  const dropdownBg = isLight
    ? 'bg-white/95 backdrop-blur-xl border-zinc-200 shadow-lg'
    : 'bg-zinc-900/95 backdrop-blur-xl border-zinc-700 shadow-lg'
  const dropdownItem = isLight
    ? 'text-zinc-600 hover:bg-zinc-100'
    : 'text-zinc-300 hover:bg-zinc-800'

  if (showSettings) {
    return (
      <div className={`flex flex-col h-screen text-zinc-100 overflow-hidden ${isLight ? 'text-zinc-800' : 'text-zinc-100'}`}>
        <SettingsView onBack={() => setShowSettings(false)} />
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className={`flex flex-col h-screen overflow-hidden relative ${isLight ? 'text-zinc-800' : 'text-zinc-100'}`}>
        <div className={`sticky top-0 z-10 ${headerBg}`}>
          <SearchBar onToggleSettings={() => setShowSettings(true)} />
          <div className="flex items-center gap-2 px-3 pb-1.5">
            <div className="flex-1 min-w-0">
              <Collections />
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={snapshotToday}
                disabled={snapshotting}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border shadow-sm ${btnHover} disabled:opacity-40 ${isLight ? 'bg-white text-amber-600 hover:bg-amber-50 hover:shadow-md border-zinc-200' : 'bg-zinc-900 text-amber-400 hover:bg-amber-950/30 hover:shadow-md border-zinc-800'}`}
                title="Snapshot all tabs in current window"
              >
                <IconSnapshot />
                <span className="hidden min-[420px]:inline">{snapshotting ? 'Snap...' : 'Snapshot Today'}</span>
                <span className="inline min-[420px]:hidden">{snapshotting ? 'Snap...' : 'Snap'}</span>
              </button>
              <button
                onClick={sendCurrentTab}
                disabled={sendingTab}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border shadow-sm ${btnHover} disabled:opacity-40 ${isLight ? 'bg-white text-indigo-600 hover:bg-indigo-50 hover:shadow-md border-zinc-200' : 'bg-zinc-900 text-indigo-400 hover:bg-indigo-950/30 hover:shadow-md border-zinc-800'}`}
                title="Send current tab to vault"
              >
                <IconSend />
                <span className="hidden min-[420px]:inline">{sendingTab ? 'Sent' : 'Current Tab'}</span>
                <span className="inline min-[420px]:hidden">Tab</span>
              </button>
            </div>
          </div>
        </div>

        <ArchiveToast />

        <div className="flex-1 min-h-0">
          {filtered.length === 0 ? (
            <EmptyState hasFilter={hasFilter} />
          ) : (
            <VirtualList items={filtered} viewMode={viewMode} />
          )}
        </div>

        {selectedIds.length > 0 ? (
          <div className={`shrink-0 sticky bottom-0 z-10 border-t ${border} px-4 py-3 ${barBg}`}>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium ${subtext} mr-auto`}>
                {selectedIds.length} selected
              </span>
              <div className="relative">
                <button
                  onClick={() => setShowMoveMenu(!showMoveMenu)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-medium border shadow-sm ${secondaryBtn}`}
                >
                  Move to
                </button>
                {showMoveMenu && (
                  <div className={`absolute bottom-full mb-1.5 right-0 backdrop-blur-xl border rounded-xl py-1 shadow-xl max-h-48 overflow-y-auto min-w-[130px] ${dropdownBg}`}>
                    {Object.keys(collections).map((name) => (
                      <button
                        key={name}
                        onClick={() => { bulkMoveToCollection(name); setShowMoveMenu(false) }}
                        className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${dropdownItem}`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={bulkDelete}
                className={`px-3 py-1.5 rounded-full text-[11px] font-medium border shadow-sm ${btnHover} ${isLight ? 'bg-white text-red-600 hover:bg-red-50 hover:shadow-md border-red-200/50' : 'bg-zinc-900 text-red-400 hover:bg-red-950/50 hover:shadow-md border-red-900/50'}`}
              >
                Delete ({selectedIds.length})
              </button>
              <button
                onClick={clearSelection}
                className={`px-3 py-1.5 rounded-full text-[11px] font-medium border shadow-sm ${secondaryBtn}`}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className={`shrink-0 sticky bottom-0 z-10 border-t ${border} px-4 py-3 ${barBg} space-y-2`}>
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
              className={`w-full py-2.5 rounded-full text-xs font-medium disabled:opacity-30 border shadow-sm ${primaryBtn}`}
            >
              {restoring ? 'Restoring...' : `Restore All (${filtered.length})`}
            </button>
            <button
              onClick={exportToMarkdown}
              className={`w-full py-2 rounded-full text-[11px] font-medium border shadow-sm ${secondaryBtn}`}
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
