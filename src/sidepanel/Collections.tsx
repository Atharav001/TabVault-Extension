import { useDroppable } from '@dnd-kit/core'
import { useVaultStore } from '../store/useVaultStore'

function DroppablePill({ name, isActive }: { name: string; isActive: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: name })
  const setSelectedCollection = useVaultStore((s) => s.setSelectedCollection)
  const theme = useVaultStore((s) => s.theme)
  const isLight = theme === 'light'

  const activeCls = isLight
    ? 'bg-violet-100/70 text-violet-700 border-violet-200/60 shadow-sm shadow-violet-200/20'
    : 'bg-zinc-700/60 text-zinc-100 border-zinc-600/60 shadow-sm'
  const idleCls = isLight
    ? 'bg-white/40 text-zinc-500 border-white/20 hover:text-zinc-700 hover:bg-white/60 hover:border-zinc-200/50'
    : 'bg-zinc-900/40 text-zinc-500 border-zinc-800/50 hover:text-zinc-300 hover:border-zinc-700/50'
  const overCls = isLight
    ? 'ring-1 ring-violet-400/60 border-violet-300/60 bg-violet-50/60'
    : 'ring-1 ring-violet-500/60 border-violet-500/60 bg-zinc-800/60'

  return (
    <button
      ref={setNodeRef}
      onClick={() => setSelectedCollection(isActive ? null : name)}
      className={`
        shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap
        transition-all duration-150 border backdrop-blur-sm
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
    ? 'bg-white/40 backdrop-blur-sm text-zinc-400 hover:text-zinc-600 hover:bg-white/60 border-white/20 hover:border-zinc-200/50'
    : 'bg-zinc-900/40 backdrop-blur-sm text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40 border-zinc-800/50'

  return (
    <div className="px-3 pb-2">
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <button
          onClick={() => {
            const name = prompt('Collection name:')
            if (name) addCollection(name)
          }}
          className={`shrink-0 size-6 flex items-center justify-center rounded-xl text-sm border transition-colors ${addCls}`}
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
