import { useDroppable } from '@dnd-kit/core'
import { useVaultStore } from '../store/useVaultStore'

function DroppablePill({ name, color, isActive }: { name: string; color: string; isActive: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: name })
  const setSelectedCollection = useVaultStore((s) => s.setSelectedCollection)

  return (
    <button
      ref={setNodeRef}
      onClick={() => setSelectedCollection(isActive ? null : name)}
      className={`
        shrink-0 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap
        transition-all duration-150 border
        ${isActive
          ? 'bg-gray-700 text-white border-gray-500'
          : 'bg-gray-800/50 text-gray-400 border-gray-700 hover:border-gray-500'
        }
        ${isOver ? 'ring-2 ring-violet-400 scale-105 border-violet-400' : ''}
      `}
      style={{ borderLeftColor: isOver ? undefined : color, borderLeftWidth: 3 }}
    >
      {name}
    </button>
  )
}

export default function Collections() {
  const collections = useVaultStore((s) => s.collections)
  const collectionOrder = useVaultStore((s) => s.collectionOrder)
  const selectedCollection = useVaultStore((s) => s.selectedCollection)
  const addCollection = useVaultStore((s) => s.addCollection)

  return (
    <div className="px-3 pb-2">
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <button
          onClick={() => addCollection(prompt('Collection name:') || '')}
          className="shrink-0 size-6 flex items-center justify-center rounded-full bg-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-700 text-sm border border-gray-700"
          title="New collection"
        >
          +
        </button>
        {collectionOrder.map((name) => {
          const col = collections[name]
          if (!col) return null
          return (
            <DroppablePill
              key={name}
              name={name}
              color={col.color}
              isActive={selectedCollection === name}
            />
          )
        })}
      </div>
    </div>
  )
}
