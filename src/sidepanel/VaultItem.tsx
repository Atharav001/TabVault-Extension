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

const glassCard = 'bg-zinc-900/60 backdrop-blur-xl border-zinc-800/60'
const glassHover = 'hover:bg-zinc-800/40 hover:border-zinc-700/60'

function ListItem({ item, style }: { item: VaultItemType; style?: React.CSSProperties }) {
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
        flex items-start gap-2.5 px-3 py-2.5 rounded-xl cursor-grab active:cursor-grabbing
        transition-all border ${glassCard}
        ${isDragging ? 'border-violet-500/50 shadow-xl shadow-violet-500/5' : `border-transparent ${glassHover}`}
      `}
    >
      <img
        src={item.favicon || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><text y="13" font-size="13">🔗</text></svg>'}
        alt=""
        className="size-4 rounded shrink-0 mt-0.5"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-zinc-200 leading-snug line-clamp-2">{item.title || 'Untitled'}</span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-[10px] text-zinc-600 mt-0.5">{daysAgo(item.createdAt)}</span>
        <button
          onClick={(e) => { e.stopPropagation(); if (item.id) restoreTab(item.id) }}
          className="p-1 rounded-md text-zinc-600 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
          title="Restore"
        >
          <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
          </svg>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); if (item.id) deleteItem(item.id) }}
          className="p-1 rounded-md text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="Delete"
        >
          <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function CardItem({ item }: { item: VaultItemType }) {
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
      style={dragStyle}
      onClick={() => { if (item.id) restoreTab(item.id) }}
      className={`
        flex flex-col rounded-xl border p-2.5 cursor-grab active:cursor-grabbing h-full
        transition-all ${glassCard}
        ${isDragging
          ? 'border-violet-500/50 shadow-xl shadow-violet-500/5'
          : glassHover
        }
      `}
    >
      <div className="flex items-start justify-between gap-1 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <img
            src={item.favicon || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><text y="13" font-size="13">🔗</text></svg>'}
            alt=""
            className="size-3.5 rounded shrink-0"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <span className="text-xs font-semibold text-zinc-200 leading-tight line-clamp-2">{item.title || 'Untitled'}</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); if (item.id) deleteItem(item.id) }}
          className="p-0.5 rounded text-zinc-600 hover:text-red-400 transition-colors shrink-0"
          title="Delete"
        >
          <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {item.textPreview && (
        <p className="text-[10px] text-zinc-500 leading-relaxed line-clamp-2 mb-1.5 flex-1">
          {item.textPreview.slice(0, 100)}
        </p>
      )}

      <div className="flex items-center justify-between mt-auto">
        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-zinc-800/60 text-zinc-500 font-medium backdrop-blur-sm">
          {item.collection || 'uncategorized'}
        </span>
        <span className="text-[9px] text-zinc-600">{daysAgo(item.createdAt)}</span>
      </div>
    </div>
  )
}

const ListVaultItem = memo(ListItem)
const CardVaultItem = memo(CardItem)

export { ListVaultItem, CardVaultItem }
