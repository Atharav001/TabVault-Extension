import { useEffect, useMemo } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { useVaultStore } from '../store/useVaultStore'
import { exportToMarkdown } from '../lib/export'
import SearchBar from './SearchBar'
import Collections from './Collections'
import VirtualList from './VirtualList'

export default function Panel() {
  const items = useVaultStore((s) => s.items)
  const searchQuery = useVaultStore((s) => s.searchQuery)
  const selectedCollection = useVaultStore((s) => s.selectedCollection)
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
      <div className="flex flex-col h-screen bg-gray-900 text-gray-100 overflow-hidden">
        <SearchBar />
        <Collections />
        {filtered.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-500 px-4 text-center">
            {searchQuery || selectedCollection
              ? 'No matching items found.'
              : 'Vault is empty. Save tabs from the context menu.'}
          </div>
        ) : (
          <VirtualList items={filtered} />
        )}
        <div className="shrink-0 border-t border-gray-800 px-3 py-2">
          <button
            onClick={exportToMarkdown}
            className="w-full py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm font-medium transition-colors"
          >
            Export to Markdown
          </button>
        </div>
      </div>
    </DndContext>
  )
}
