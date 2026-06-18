import { useRef, useEffect, memo, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { VaultItem as VaultItemType } from '../db/vaultDB'
import { ListVaultItem, CardVaultItem } from './VaultItem'
import { useVaultStore } from '../store/useVaultStore'

type Row =
  | { type: 'header'; label: string; isSession: boolean }
  | { type: 'item'; item: VaultItemType }

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function formatDate(ts: number): string {
  const date = new Date(ts)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (isSameDay(date, today)) return 'Today'
  if (isSameDay(date, yesterday)) return 'Yesterday'
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function buildRows(items: VaultItemType[]): Row[] {
  const groups = new Map<string, { items: VaultItemType[]; isSession: boolean }>()

  for (const item of items) {
    const label = formatDate(item.createdAt)
    if (!groups.has(label)) {
      groups.set(label, { items: [], isSession: false })
    }
    const group = groups.get(label)!
    group.items.push(item)
    if (item.collection.startsWith('Session:')) {
      group.isSession = true
    }
  }

  const rows: Row[] = []
  for (const [label, group] of groups) {
    rows.push({ type: 'header', label, isSession: group.isSession })
    for (const item of group.items) {
      rows.push({ type: 'item', item })
    }
  }
  return rows
}

function VirtualListInner({ items, viewMode }: { items: VaultItemType[]; viewMode: 'list' | 'card' }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const isCard = viewMode === 'card'
  const isLight = useVaultStore((s) => s.theme) === 'light'

  const rows = useMemo(() => buildRows(items), [items])

  const estimateSize = useMemo(() => {
    return (index: number) => {
      const row = rows[index]
      if (!row) return 54
      if (row.type === 'header') return 28
      return isCard ? 108 : 54
    }
  }, [rows, isCard])

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize,
    overscan: isCard ? 3 : 8,
  })

  useEffect(() => {
    virtualizer.measure()
  })

  const headerCls = (row: { type: 'header'; label: string; isSession: boolean }) => {
    if (row.isSession) {
      return isLight ? 'font-bold text-indigo-600' : 'font-bold text-indigo-400'
    }
    return isLight ? 'font-semibold text-zinc-400' : 'font-semibold text-zinc-500'
  }

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto px-3">
      <div
        style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const row = rows[virtualRow.index]
          if (!row) return null

          if (row.type === 'header') {
            return (
              <div
                key={`h-${virtualRow.index}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className={`px-0 flex items-end pb-1 ${headerCls(row)}`}
              >
                <span className="text-[11px] tracking-wide uppercase">{row.label}</span>
                {row.isSession && (
                  <span className={`ml-2 text-[9px] uppercase tracking-wider ${isLight ? 'text-indigo-500/80' : 'text-indigo-400/80'}`}>Snapshot</span>
                )}
              </div>
            )
          }

          if (isCard) {
            return null
          }

          return (
            <div
              key={row.item.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <ListVaultItem item={row.item} />
            </div>
          )
        })}

        {isCard && (() => {
          const itemRows = rows.filter(r => r.type === 'item')
          const cardPairs: { items: VaultItemType[]; start: number }[] = []
          for (let i = 0; i < itemRows.length; i += 2) {
            const a = itemRows[i] as { type: 'item'; item: VaultItemType } | undefined
            const b = itemRows[i + 1] as { type: 'item'; item: VaultItemType } | undefined
            if (!a) continue
            cardPairs.push({
              items: [a.item, b?.item].filter(Boolean) as VaultItemType[],
              start: 0,
            })
          }

          let pairIdx = 0
          return virtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index]
            if (!row || row.type === 'header') return null

            const pair = cardPairs[pairIdx++]
            if (!pair) return null

            return (
              <div
                key={`p-${pairIdx}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div className="flex gap-1.5 px-0 py-1 h-full">
                  {pair.items.map((item) => (
                    <div key={item.id} className="flex-1 min-w-0">
                      <CardVaultItem item={item} />
                    </div>
                  ))}
                  {pair.items.length === 1 && <div className="flex-1" />}
                </div>
              </div>
            )
          })
        })()}
      </div>
    </div>
  )
}

const VirtualList = memo(VirtualListInner)
export default VirtualList
