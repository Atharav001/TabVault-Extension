import { useDroppable } from '@dnd-kit/core'
import { useVaultStore } from '../store/useVaultStore'

function DroppablePill({ name, isActive }: { name: string; isActive: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: name })
  const setSelectedCollection = useVaultStore((s) => s.setSelectedCollection)
  const theme = useVaultStore((s) => s.theme)
  const isLight = theme === 'light'

  const activeCls = isLight
    ? 'bg-zinc-900/90 backdrop-blur-xl text-white border-zinc-900/50 shadow-sm'
    : 'bg-zinc-100/90 backdrop-blur-xl text-black border-zinc-100/50 shadow-sm'
  const idleCls = isLight
    ? 'bg-white/40 backdrop-blur-xl text-zinc-600 border-black/5 hover:bg-white/70 hover:text-zinc-800'
    : 'bg-zinc-900/40 backdrop-blur-xl text-zinc-400 border-white/10 hover:bg-zinc-900/70 hover:text-zinc-200'
  const overCls = isLight
    ? 'ring-2 ring-indigo-400/60 border-indigo-400/60 bg-white/70'
    : 'ring-2 ring-indigo-500/60 border-indigo-500/60 bg-zinc-900/70'

  return (
    <button
      ref={setNodeRef}
      onClick={() => setSelectedCollection(isActive ? null : name)}
      className={`
        shrink-0 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap
        transition-all duration-150 border
        ${isActive ? activeCls : idleCls}
        ${isOver ? overCls : ''}
      `}
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
  const theme = useVaultStore((s) => s.theme)
  const isLight = theme === 'light'

  const addCls = isLight
    ? 'bg-white/40 backdrop-blur-xl text-zinc-500 hover:text-zinc-700 hover:bg-white/70 border-black/5'
    : 'bg-zinc-900/40 backdrop-blur-xl text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/70 border-white/10'

  return (
    <div className="min-w-0 overflow-hidden px-2 pb-1.5">
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <button
          onClick={() => {
            const name = prompt('Collection name:')
            if (name) addCollection(name)
          }}
          className={`shrink-0 size-6 flex items-center justify-center rounded-full text-sm border transition-colors ${addCls}`}
          title="New collection"
        >
          <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
        {collectionOrder.map((name) => {
          if (!collections[name]) return null
          return (
            <DroppablePill
              key={name}
              name={name}
              isActive={selectedCollection === name}
            />
          )
        })}
      </div>
    </div>
  )
}
