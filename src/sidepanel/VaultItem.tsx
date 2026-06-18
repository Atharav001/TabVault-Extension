import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { memo, useState } from 'react'
import type { VaultItem as VaultItemType } from '../db/vaultDB'
import { useVaultStore } from '../store/useVaultStore'
import { restoreTab } from '../lib/restore'

function daysAgo(ts: number): string {
  const days = Math.floor((Date.now() - ts) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

function hashColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const colors = ['#7C3AED', '#3B82F6', '#F59E0B', '#10B981', '#EC4899', '#EF4444', '#8B5CF6', '#06B6D4']
  return colors[Math.abs(hash) % colors.length]
}

function Favicon({ item }: { item: VaultItemType }) {
  const [broken, setBroken] = useState(false)
  if (broken || !item.favicon) {
    const letter = (item.title || '?').charAt(0).toUpperCase()
    const bg = hashColor(item.title || '?')
    return (
      <div
        className="size-4 rounded shrink-0 flex items-center justify-center text-[9px] font-bold text-white"
        style={{ backgroundColor: bg }}
      >
        {letter}
      </div>
    )
  }
  return (
    <img
      src={item.favicon}
      alt=""
      className="size-4 rounded shrink-0 mt-0.5"
      onError={() => setBroken(true)}
    />
  )
}

function FaviconCard({ item }: { item: VaultItemType }) {
  const [broken, setBroken] = useState(false)
  if (broken || !item.favicon) {
    const letter = (item.title || '?').charAt(0).toUpperCase()
    const bg = hashColor(item.title || '?')
    return (
      <div
        className="size-3.5 rounded shrink-0 flex items-center justify-center text-[8px] font-bold text-white"
        style={{ backgroundColor: bg }}
      >
        {letter}
      </div>
    )
  }
  return (
    <img
      src={item.favicon}
      alt=""
      className="size-3.5 rounded shrink-0"
      onError={() => setBroken(true)}
    />
  )
}

function Checkbox({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  const theme = useVaultStore((s) => s.theme)
  const borderCls = theme === 'light' ? 'border-zinc-300 hover:border-zinc-400' : 'border-zinc-600 hover:border-zinc-500'
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle() }}
      className={`shrink-0 size-4 rounded border flex items-center justify-center transition-colors ${checked ? 'bg-violet-500 border-violet-500' : borderCls}`}
    >
      {checked && (
        <svg className="size-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      )}
    </button>
  )
}

function ListItem({ item, style }: { item: VaultItemType; style?: React.CSSProperties }) {
  const deleteItem = useVaultStore((s) => s.deleteItem)
  const selectedIds = useVaultStore((s) => s.selectedIds)
  const toggleSelect = useVaultStore((s) => s.toggleSelect)
  const theme = useVaultStore((s) => s.theme)
  const isLight = theme === 'light'
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: String(item.id!),
    data: { item },
  })

  const dragStyle: React.CSSProperties = transform
    ? { transform: CSS.Translate.toString(transform), zIndex: 50, opacity: 0.85 }
    : {}

  const isSelected = item.id ? selectedIds.includes(item.id) : false

  const cardCls = isLight
    ? 'bg-white/50 backdrop-blur-xl border-white/30'
    : 'bg-zinc-900/60 backdrop-blur-xl border-zinc-800/60'
  const hoverCls = isLight
    ? 'hover:bg-white/70 hover:border-zinc-200/50'
    : 'hover:bg-zinc-800/40 hover:border-zinc-700/60'
  const selectedCls = isLight
    ? 'border-violet-300/60 bg-violet-50/60'
    : 'border-violet-500/40 bg-zinc-800/50'
  const textCls = isLight ? 'text-zinc-700' : 'text-zinc-200'

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ ...style, ...dragStyle }}
      className={`
        flex items-start gap-2.5 px-3 py-2.5 rounded-xl cursor-grab active:cursor-grabbing
        transition-all border shadow-sm
        ${cardCls}
        ${isSelected ? selectedCls : ''}
        ${!isSelected && !isDragging ? hoverCls : ''}
        ${isLight && !isSelected ? 'shadow-zinc-200/20' : ''}
      `}
    >
      <div className="mt-0.5" onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={isSelected} onToggle={() => item.id && toggleSelect(item.id)} />
      </div>
      <Favicon item={item} />
      <div className="flex-1 min-w-0">
        <span className={`text-sm font-medium leading-snug line-clamp-2 ${textCls}`}>{item.title || 'Untitled'}</span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-[10px] text-zinc-500 mt-0.5">{daysAgo(item.createdAt)}</span>
        <button
          onClick={(e) => { e.stopPropagation(); if (item.id) restoreTab(item.id) }}
          className="p-1 rounded-md text-zinc-400 hover:text-blue-500 hover:bg-blue-100/50 transition-colors"
          title="Restore"
        >
          <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
          </svg>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); if (item.id) deleteItem(item.id) }}
          className="p-1 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-100/50 transition-colors"
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
  const selectedIds = useVaultStore((s) => s.selectedIds)
  const toggleSelect = useVaultStore((s) => s.toggleSelect)
  const theme = useVaultStore((s) => s.theme)
  const isLight = theme === 'light'
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: String(item.id!),
    data: { item },
  })

  const dragStyle: React.CSSProperties = transform
    ? { transform: CSS.Translate.toString(transform), zIndex: 50, opacity: 0.85 }
    : {}

  const isSelected = item.id ? selectedIds.includes(item.id) : false

  const cardCls = isLight
    ? 'bg-white/50 backdrop-blur-xl border-white/30'
    : 'bg-zinc-900/60 backdrop-blur-xl border-zinc-800/60'
  const hoverCls = isLight
    ? 'hover:bg-white/70 hover:border-zinc-200/50'
    : 'hover:bg-zinc-800/40 hover:border-zinc-700/60'
  const selectedCls = isLight
    ? 'border-violet-300/60 bg-violet-50/60'
    : 'border-violet-500/40 bg-zinc-800/50'
  const textCls = isLight ? 'text-zinc-700' : 'text-zinc-200'

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={dragStyle}
      onClick={() => { if (item.id && !isDragging) restoreTab(item.id) }}
      className={`
        flex flex-col rounded-xl border p-2.5 cursor-grab active:cursor-grabbing h-full
        transition-all shadow-sm
        ${cardCls}
        ${isSelected ? selectedCls : ''}
        ${!isSelected && !isDragging ? hoverCls : ''}
        ${isLight && !isSelected ? 'shadow-zinc-200/20' : ''}
      `}
    >
      <div className="flex items-start justify-between gap-1 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={isSelected} onToggle={() => item.id && toggleSelect(item.id)} />
          </div>
          <FaviconCard item={item} />
          <span className={`text-xs font-semibold leading-tight line-clamp-2 ${textCls}`}>{item.title || 'Untitled'}</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); if (item.id) deleteItem(item.id) }}
          className="p-0.5 rounded text-zinc-400 hover:text-red-500 transition-colors shrink-0"
          title="Delete"
        >
          <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {item.textPreview && (
        <p className="text-[10px] text-zinc-400 leading-relaxed line-clamp-2 mb-1.5 flex-1">
          {item.textPreview.slice(0, 100)}
        </p>
      )}

      <div className="flex items-center justify-between mt-auto">
        <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-medium backdrop-blur-sm ${isLight ? 'bg-zinc-100/60 text-zinc-400' : 'bg-zinc-800/60 text-zinc-500'}`}>
          {item.collection || 'uncategorized'}
        </span>
        <span className="text-[9px] text-zinc-500">{daysAgo(item.createdAt)}</span>
      </div>
    </div>
  )
}

const ListVaultItem = memo(ListItem)
const CardVaultItem = memo(CardItem)

export { ListVaultItem, CardVaultItem, Favicon, FaviconCard, Checkbox }
