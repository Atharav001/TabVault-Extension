import { useRef, useEffect, useState } from 'react'
import { useVaultStore } from '../store/useVaultStore'

export default function SearchBar({ onToggleSettings }: { onToggleSettings: () => void }) {
  const searchQuery = useVaultStore((s) => s.searchQuery)
  const setSearchQuery = useVaultStore((s) => s.setSearchQuery)
  const viewMode = useVaultStore((s) => s.viewMode)
  const setViewMode = useVaultStore((s) => s.setViewMode)
  const cardColumns = useVaultStore((s) => s.cardColumns)
  const setCardColumns = useVaultStore((s) => s.setCardColumns)
  const theme = useVaultStore((s) => s.theme)
  const isLight = theme === 'light'

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [isNarrow, setIsNarrow] = useState(false)
  const [searchActive, setSearchActive] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setIsNarrow(entry.contentRect.width < 360)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (searchActive && inputRef.current) {
      inputRef.current.focus()
    }
  }, [searchActive])

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape' && searchActive) {
        setSearchActive(false)
        setSearchQuery('')
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [searchActive, setSearchQuery])

  const inputCls = isLight
    ? 'bg-white text-zinc-700 placeholder-zinc-400 border-zinc-200 shadow-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50'
    : 'bg-zinc-900 text-zinc-100 placeholder-zinc-500 border-zinc-800 shadow-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50'

  const toggleBg = isLight
    ? 'bg-white border-zinc-200 shadow-sm'
    : 'bg-zinc-900 border-zinc-800 shadow-sm'

  const activeCls = isLight
    ? 'bg-zinc-900 text-white'
    : 'bg-zinc-100 text-black'

  const inactiveCls = isLight
    ? 'text-zinc-400 hover:text-zinc-600'
    : 'text-zinc-500 hover:text-zinc-300'

  const iconCls = isLight
    ? 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 border-zinc-200/50'
    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 border-zinc-800'

  const closeCls = isLight
    ? 'text-zinc-400 hover:text-red-500 hover:bg-red-50 border-zinc-200/50'
    : 'text-zinc-500 hover:text-red-400 hover:bg-red-950/50 border-zinc-800'

  const searchIconCls = isLight
    ? 'text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 border-zinc-200/50'
    : 'text-zinc-500 hover:text-indigo-400 hover:bg-indigo-950/50 border-zinc-800'

  const backCls = isLight
    ? 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100'
    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'

  const btnTransition = 'transition-all duration-200 hover:scale-105 active:scale-95'

  if (isNarrow && searchActive) {
    return (
      <div ref={containerRef} className="flex items-center gap-2 px-3 pt-3 pb-2">
        <button
          onClick={() => { setSearchActive(false); setSearchQuery('') }}
          className={`shrink-0 size-8 flex items-center justify-center rounded-xl ${btnTransition} ${backCls}`}
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </button>
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vault..."
            className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm transition-all outline-none ${inputCls}`}
          />
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex items-center gap-2 px-3 pt-3 pb-2">
      {isNarrow ? (
        <button
          onClick={() => setSearchActive(true)}
          className={`shrink-0 size-8 flex items-center justify-center rounded-xl border ${btnTransition} ${searchIconCls}`}
          title="Search"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </button>
      ) : (
        <div className="relative flex-1 min-w-0">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vault..."
            className={`w-full pl-9 pr-3 py-2 rounded-xl border text-sm transition-all outline-none ${inputCls}`}
          />
        </div>
      )}

      <div className={`flex rounded-xl border overflow-hidden shrink-0 ${toggleBg}`}>
        <button
          onClick={() => setViewMode('list')}
          className={`p-1.5 ${btnTransition} ${viewMode === 'list' ? activeCls : inactiveCls}`}
          title="List view"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6h16.5M3.75 12h16.5M3.75 18h16.5" />
          </svg>
        </button>
        <button
          onClick={() => setViewMode('card')}
          className={`p-1.5 ${btnTransition} ${viewMode === 'card' ? activeCls : inactiveCls}`}
          title="Card view"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
          </svg>
        </button>
      </div>

      {viewMode === 'card' && (
        <div className={`flex rounded-xl border overflow-hidden shrink-0 ${toggleBg}`}>
          <button
            onClick={() => setCardColumns('1')}
            className={`px-1.5 py-1 text-[10px] font-semibold ${btnTransition} ${cardColumns === '1' ? activeCls : inactiveCls}`}
            title="Single column"
          >1</button>
          <button
            onClick={() => setCardColumns('2')}
            className={`px-1.5 py-1 text-[10px] font-semibold ${btnTransition} ${cardColumns === '2' ? activeCls : inactiveCls}`}
            title="Two columns"
          >2</button>
          <button
            onClick={() => setCardColumns('auto')}
            className={`px-1.5 py-1 text-[10px] font-semibold ${btnTransition} ${cardColumns === 'auto' ? activeCls : inactiveCls}`}
            title="Auto columns"
          >
            <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125Z" />
            </svg>
          </button>
        </div>
      )}

      <button
        onClick={onToggleSettings}
        className={`shrink-0 size-8 flex items-center justify-center rounded-xl border ${btnTransition} ${iconCls}`}
        title="Settings"
      >
        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      </button>

      <button
        onClick={() => window.close()}
        className={`shrink-0 size-8 flex items-center justify-center rounded-xl border ${btnTransition} ${closeCls}`}
        title="Close panel"
      >
        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
