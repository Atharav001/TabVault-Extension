import { useEffect, useMemo } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { useVaultStore } from '../store/useVaultStore'
import { exportToMarkdown } from '../lib/export'
import SearchBar from './SearchBar'
import Collections from './Collections'
import VirtualList from './VirtualList'
import EmptyState from './EmptyState'

export default function Panel() {
  const items = useVaultStore((s) => s.items)
  const searchQuery = useVaultStore((s) => s.searchQuery)
  const selectedCollection = useVaultStore((s) => s.selectedCollection)
  const viewMode = useVaultStore((s) => s.viewMode)
  const fetchItems = useVaultStore((s) => s.fetchItems)
  const moveToCollection = useVaultStore((s) => s.moveToCollection)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

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

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || !active) return
    const itemId = Number(active.id)
    const collection = over.id as string
    if (itemId && collection) {
      moveToCollection(itemId, collection)
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-screen bg-[#121212] text-zinc-100 overflow-hidden">
        <div className="relative bg-gradient-to-b from-zinc-900/40 to-transparent">
          <SearchBar />
          <Collections />
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

        <div className="shrink-0 border-t border-zinc-800/40 px-3 py-2 bg-gradient-to-t from-zinc-900/30 to-transparent backdrop-blur-sm">
          <button
            onClick={exportToMarkdown}
            className="w-full py-2 rounded-xl text-xs font-medium text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/40 backdrop-blur-sm transition-colors border border-transparent hover:border-zinc-800/60"
          >
            Export to Markdown
          </button>
        </div>
      </div>
    </DndContext>
  )
}
