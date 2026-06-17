import { useRef, useEffect, memo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { VaultItem as VaultItemType } from '../db/vaultDB'
import VaultItem from './VaultItem'

function VirtualListInner({ items }: { items: VaultItemType[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 62,
    overscan: 5,
  })

  useEffect(() => {
    virtualizer.measure()
  })

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
              <VaultItem item={item} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

const VirtualList = memo(VirtualListInner)
export default VirtualList
