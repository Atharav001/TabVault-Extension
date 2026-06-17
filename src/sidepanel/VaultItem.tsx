import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { memo } from 'react'
import type { VaultItem as VaultItemType } from '../db/vaultDB'
import { useVaultStore } from '../store/useVaultStore'
import { restoreTab } from '../lib/restore'

function daysAgo(ts: number): string {
  const days = Math.floor((Date.now() - ts) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

function VaultItemInner({ item, style }: { item: VaultItemType; style?: React.CSSProperties }) {
  const deleteItem = useVaultStore((s) => s.deleteItem)
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: String(item.id!),
    data: { item },
  })

  const dragStyle: React.CSSProperties = transform
    ? { transform: CSS.Translate.toString(transform), zIndex: 50, opacity: 0.85 }
    : {}

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ ...style, ...dragStyle }}
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-grab active:cursor-grabbing
        transition-colors border
        ${isDragging ? 'border-violet-500/50 bg-gray-700/50 shadow-lg' : 'border-transparent hover:bg-gray-800/60'}
      `}
    >
      <img
        src={item.favicon || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><text y="13" font-size="13">🔗</text></svg>'}
        alt=""
        className="size-5 rounded shrink-0"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-100 truncate">{item.title || 'Untitled'}</div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="truncate max-w-[140px]">{item.url}</span>
          <span className="shrink-0">{daysAgo(item.createdAt)}</span>
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation()
          if (item.id) restoreTab(item.id)
        }}
        className="shrink-0 text-gray-600 hover:text-blue-400 transition-colors text-sm px-1"
        title="Restore tab"
      >
        ↻
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          if (item.id) deleteItem(item.id)
        }}
        className="shrink-0 text-gray-600 hover:text-red-400 transition-colors text-sm"
        title="Delete"
      >
        ✕
      </button>
    </div>
  )
}

const VaultItem = memo(VaultItemInner)
export default VaultItem
