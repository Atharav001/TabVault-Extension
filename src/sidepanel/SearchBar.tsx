import { useVaultStore } from '../store/useVaultStore'

export default function SearchBar() {
  const searchQuery = useVaultStore((s) => s.searchQuery)
  const setSearchQuery = useVaultStore((s) => s.setSearchQuery)
  const viewMode = useVaultStore((s) => s.viewMode)
  const setViewMode = useVaultStore((s) => s.setViewMode)

  return (
    <div className="flex items-center gap-2 px-3 pt-3 pb-2">
      <div className="relative flex-1">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search vault..."
          className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900/60 backdrop-blur-xl text-zinc-100 placeholder-zinc-500 border border-zinc-800/60 focus:outline-none focus:ring-1 focus:ring-zinc-600/50 focus:border-zinc-600/50 text-sm transition-all"
        />
      </div>

      <div className="flex rounded-xl border border-zinc-800/60 overflow-hidden shrink-0 bg-zinc-900/30 backdrop-blur-sm">
        <button
          onClick={() => setViewMode('list')}
          className={`p-1.5 transition-colors ${viewMode === 'list' ? 'bg-zinc-700/60 text-zinc-200' : 'bg-transparent text-zinc-500 hover:text-zinc-300'}`}
          title="List view"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6h16.5M3.75 12h16.5M3.75 18h16.5" />
          </svg>
        </button>
        <button
          onClick={() => setViewMode('card')}
          className={`p-1.5 transition-colors ${viewMode === 'card' ? 'bg-zinc-700/60 text-zinc-200' : 'bg-transparent text-zinc-500 hover:text-zinc-300'}`}
          title="Card view"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
