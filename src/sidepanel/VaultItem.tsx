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

const PASTELS = [
  'bg-red-200 text-red-700',
  'bg-orange-200 text-orange-700',
  'bg-amber-200 text-amber-700',
  'bg-yellow-200 text-yellow-700',
  'bg-lime-200 text-lime-700',
  'bg-green-200 text-green-700',
  'bg-emerald-200 text-emerald-700',
  'bg-teal-200 text-teal-700',
  'bg-cyan-200 text-cyan-700',
  'bg-sky-200 text-sky-700',
  'bg-blue-200 text-blue-700',
  'bg-indigo-200 text-indigo-700',
  'bg-violet-200 text-violet-700',
  'bg-purple-200 text-purple-700',
  'bg-fuchsia-200 text-fuchsia-700',
  'bg-pink-200 text-pink-700',
  'bg-rose-200 text-rose-700',
]

function hashColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return PASTELS[Math.abs(hash) % PASTELS.length]
}

function Favicon({ item }: { item: VaultItemType }) {
  const [broken, setBroken] = useState(false)
  if (broken || !item.favicon) {
    const letter = (item.title || '?').charAt(0).toUpperCase()
    const pastel = hashColor(item.title || '?')
    return (
      <div
        className={`size-4 rounded shrink-0 flex items-center justify-center text-[9px] font-bold ${pastel}`}
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
    const pastel = hashColor(item.title || '?')
    return (
      <div
        className={`size-3.5 rounded shrink-0 flex items-center justify-center text-[8px] font-bold ${pastel}`}
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
      className={`shrink-0 size-4 rounded border flex items-center justify-center transition-colors ${checked ? 'bg-indigo-500 border-indigo-500' : borderCls}`}
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
    ? 'bg-white border-zinc-200'
    : 'bg-zinc-900 border-zinc-800'
  const hoverCls = isLight
    ? 'hover:shadow-sm hover:bg-zinc-50'
    : 'hover:bg-zinc-800/50'
  const selectedCls = isLight
    ? 'border-indigo-400/60 bg-indigo-50/60 shadow-sm'
    : 'border-indigo-500/40 bg-zinc-800/50'
  const textCls = isLight ? 'text-zinc-800' : 'text-zinc-100'

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ ...style, ...dragStyle }}
      className={`
        flex items-start gap-2.5 px-3 py-2.5 rounded-lg cursor-grab active:cursor-grabbing
        transition-all border
        ${cardCls}
        ${isSelected ? selectedCls : ''}
        ${!isSelected && !isDragging ? hoverCls : ''}
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
          className="p-1 rounded-md text-zinc-400 hover:text-indigo-500 hover:bg-indigo-100/50 transition-all duration-200 hover:scale-110 active:scale-90"
          title="Restore"
        >
          <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
          </svg>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); if (item.id) deleteItem(item.id) }}
          className="p-1 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-100/50 transition-all duration-200 hover:scale-110 active:scale-90"
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
    ? 'bg-white border-zinc-200'
    : 'bg-zinc-900 border-zinc-800'
  const hoverCls = isLight
    ? 'hover:shadow-sm hover:bg-zinc-50'
    : 'hover:bg-zinc-800/50'
  const selectedCls = isLight
    ? 'border-indigo-400/60 bg-indigo-50/60 shadow-sm'
    : 'border-indigo-500/40 bg-zinc-800/50'
  const textCls = isLight ? 'text-zinc-800' : 'text-zinc-100'

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={dragStyle}
      onClick={() => { if (item.id && !isDragging) restoreTab(item.id) }}
      className={`
        flex flex-col rounded-lg border p-2.5 cursor-grab active:cursor-grabbing h-full
        transition-all
        ${cardCls}
        ${isSelected ? selectedCls : ''}
        ${!isSelected && !isDragging ? hoverCls : ''}
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
          className="p-0.5 rounded text-zinc-400 hover:text-red-500 transition-all duration-200 hover:scale-110 active:scale-90 shrink-0"
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
        <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-medium ${isLight ? 'bg-zinc-100 text-zinc-500' : 'bg-zinc-800 text-zinc-400'}`}>
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
