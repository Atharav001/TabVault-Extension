import { useRef, useEffect, memo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { VaultItem as VaultItemType } from '../db/vaultDB'
import { ListVaultItem, CardVaultItem } from './VaultItem'

function VirtualListInner({ items, viewMode }: { items: VaultItemType[]; viewMode: 'list' | 'card' }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const isCard = viewMode === 'card'
  const rowCount = isCard ? Math.ceil(items.length / 2) : items.length
  const estimateSize = isCard ? 108 : 54

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimateSize,
    overscan: isCard ? 3 : 5,
  })

  useEffect(() => {
    virtualizer.measure()
  })

  if (isCard) {
    return (
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div
          style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const startIdx = virtualRow.index * 2
            const itemA = items[startIdx]
            const itemB = items[startIdx + 1]
            return (
              <div
                key={virtualRow.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div className="flex gap-1.5 px-3 py-1 h-full">
                  {itemA && (
                    <div className="flex-1 min-w-0">
                      <CardVaultItem item={itemA} />
                    </div>
                  )}
                  {itemB && (
                    <div className="flex-1 min-w-0">
                      <CardVaultItem item={itemB} />
                    </div>
                  )}
                  {!itemB && <div className="flex-1" />}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto">
      <div
        style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const item = items[virtualItem.index]
          return (
            <div
              key={item.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <ListVaultItem item={item} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

const VirtualList = memo(VirtualListInner)
export default VirtualList
