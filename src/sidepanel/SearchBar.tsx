import { useVaultStore } from '../store/useVaultStore'

export default function SearchBar() {
  const searchQuery = useVaultStore((s) => s.searchQuery)
  const setSearchQuery = useVaultStore((s) => s.setSearchQuery)

  return (
    <div className="px-3 pt-3 pb-2">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search vault..."
        className="w-full px-3 py-2 rounded-lg bg-gray-800 text-gray-100 placeholder-gray-500 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
      />
    </div>
  )
}
