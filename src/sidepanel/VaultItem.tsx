import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { memo, useState } from 'react'
import type { VaultItem as VaultItemType } from '../db/vaultDB'
import { vaultDB } from '../db/vaultDB'
import { useVaultStore } from '../store/useVaultStore'
import { restoreTab } from '../lib/restore'

async function openItem(item: VaultItemType, keepInVault: boolean) {
  await chrome.tabs.create({ url: item.url, active: true })
  if (!keepInVault && item.id) {
    await vaultDB.vault_items.delete(item.id)
    useVaultStore.getState().fetchItems()
    chrome.runtime.sendMessage({ type: 'UPDATE_BADGE' })
  }
}

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

const FALLBACK_ORDER = ['primary', 'google', 'letter'] as const
type FavState = (typeof FALLBACK_ORDER)[number]

function useFavState(item: VaultItemType): [string | null, FavState, () => void] {
  const [state, setState] = useState<FavState>(() => {
    if (item.favicon) return 'primary'
    if (item.faviconFallback) return 'google'
    return 'letter'
  })
  const onError = () => {
    setState((s) => {
      const idx = FALLBACK_ORDER.indexOf(s)
      return idx < FALLBACK_ORDER.length - 1 ? FALLBACK_ORDER[idx + 1] : s
    })
  }
  const src = state === 'primary' ? item.favicon : state === 'google' ? item.faviconFallback : null
  return [src, state, onError]
}

function LetterIcon({ title, size, rounded }: { title: string; size: string; rounded: string }) {
  const letter = (title || '?').charAt(0).toUpperCase()
  return (
    <div className={`${size} ${rounded} shrink-0 flex items-center justify-center text-[9px] font-bold ${hashColor(title || '?')}`}>
      {letter}
    </div>
  )
}

function FaviconFallbackImg({ src, state, onError, className }: { src: string | null; state: FavState; onError: () => void; className: string }) {
  if (state === 'letter' || !src) {
    return null
  }
  return (
    <img
      src={src}
      alt=""
      className={className}
      onError={onError}
    />
  )
}

function Favicon({ item }: { item: VaultItemType }) {
  const [src, state, onError] = useFavState(item)
  if (state === 'letter' || !src) {
    return <LetterIcon title={item.title} size="size-4" rounded="rounded" />
  }
  return <FaviconFallbackImg src={src} state={state} onError={onError} className="size-4 rounded shrink-0 mt-0.5" />
}

function FaviconCard({ item }: { item: VaultItemType }) {
  const [src, state, onError] = useFavState(item)
  if (state === 'letter' || !src) {
    return <LetterIcon title={item.title} size="size-3.5" rounded="rounded" />
  }
  return <FaviconFallbackImg src={src} state={state} onError={onError} className="size-3.5 rounded shrink-0" />
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
    ? 'bg-white/60 border-black/5 shadow-sm shadow-zinc-300/50'
    : 'bg-zinc-900/60 border-white/10'
  const hoverCls = isLight
    ? 'hover:bg-white/80 hover:shadow-md'
    : 'hover:bg-zinc-900/80'
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
        flex items-start gap-2 px-2 py-2 rounded-lg cursor-grab active:cursor-grabbing
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
      <div className="flex-1 min-w-0 cursor-pointer" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => openItem(item, e.metaKey || e.ctrlKey)}>
        <span className={`text-sm font-medium leading-snug line-clamp-2 ${textCls}`}>{item.title || 'Untitled'}</span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-[10px] text-zinc-500 mt-0.5">{daysAgo(item.createdAt)}</span>
        <button
          onClick={async (e) => {
            e.stopPropagation()
            if (item.id) {
              await restoreTab(item.id)
              await vaultDB.vault_items.delete(item.id)
              useVaultStore.getState().fetchItems()
              chrome.runtime.sendMessage({ type: 'UPDATE_BADGE' })
            }
          }}
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

function FaviconBig({ item }: { item: VaultItemType }) {
  const [src, state, onError] = useFavState(item)
  if (state === 'letter' || !src) {
    return <LetterIcon title={item.title} size="size-7" rounded="rounded-lg" />
  }
  return <FaviconFallbackImg src={src} state={state} onError={onError} className="size-7 rounded-lg" />
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
    ? 'bg-white/60 border-black/5 shadow-sm shadow-zinc-300/50'
    : 'bg-zinc-900/60 border-white/10'
  const hoverCls = isLight
    ? 'hover:bg-white/80 hover:shadow-md'
    : 'hover:bg-zinc-900/80'
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
      className={`
        relative flex flex-col items-center justify-center gap-1.5
        aspect-square rounded-lg border p-2 cursor-grab active:cursor-grabbing
        transition-all
        ${cardCls}
        ${isSelected ? selectedCls : ''}
        ${!isSelected && !isDragging ? hoverCls : ''}
      `}
    >
      <div className="absolute top-1.5 left-1.5" onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={isSelected} onToggle={() => item.id && toggleSelect(item.id)} />
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); if (item.id) deleteItem(item.id) }}
        className="absolute top-1.5 right-1.5 p-0.5 rounded text-zinc-400 hover:text-red-500 transition-all duration-200 hover:scale-110 active:scale-90"
        title="Delete"
      >
        <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
      <div
        className="flex flex-col items-center gap-1 cursor-pointer"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => openItem(item, e.metaKey || e.ctrlKey)}
      >
        <FaviconBig item={item} />
        <span className={`text-[10px] font-medium text-center leading-tight line-clamp-2 px-0.5 ${textCls}`}>
          {item.title || 'Untitled'}
        </span>
      </div>
    </div>
  )
}

function CompactListItem({ item }: { item: VaultItemType }) {
  const deleteItem = useVaultStore((s) => s.deleteItem)
  const selectedIds = useVaultStore((s) => s.selectedIds)
  const toggleSelect = useVaultStore((s) => s.toggleSelect)
  const theme = useVaultStore((s) => s.theme)
  const isLight = theme === 'light'
  const isSelected = item.id ? selectedIds.includes(item.id) : false
  const cardCls = isLight ? 'bg-white/60 border-black/5' : 'bg-zinc-900/60 border-white/10'
  const hoverCls = isLight ? 'hover:bg-white/80' : 'hover:bg-zinc-900/80'
  const selectedCls = isLight ? 'border-indigo-400/60 bg-indigo-50/60' : 'border-indigo-500/40 bg-zinc-800/50'
  const textCls = isLight ? 'text-zinc-800' : 'text-zinc-100'

  return (
    <div className={`flex items-center gap-1.5 px-1.5 py-1.5 rounded-md border transition-colors ${cardCls} ${isSelected ? selectedCls : hoverCls}`}>
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={isSelected} onToggle={() => item.id && toggleSelect(item.id)} />
      </div>
      <Favicon item={item} />
      <span className={`text-[11px] font-medium leading-tight truncate flex-1 min-w-0 ${textCls}`}>{item.title || 'Untitled'}</span>
      <button
        onClick={(e) => { e.stopPropagation(); if (item.id) deleteItem(item.id) }}
        className="p-0.5 rounded text-zinc-400 hover:text-red-500 transition-all duration-200 shrink-0"
        title="Delete"
      >
        <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

const ListVaultItem = memo(ListItem)
const CardVaultItem = memo(CardItem)
const CompactVaultItem = memo(CompactListItem)

export { ListVaultItem, CardVaultItem, CompactVaultItem, Favicon, FaviconCard, Checkbox }
