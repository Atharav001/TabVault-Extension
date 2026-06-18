import { useVaultStore } from '../store/useVaultStore'

export default function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  const theme = useVaultStore((s) => s.theme)

  const headCls = theme === 'light' ? 'text-zinc-600' : 'text-zinc-300'
  const subCls = theme === 'light' ? 'text-zinc-400' : 'text-zinc-600'

  if (hasFilter) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="size-10 rounded-xl bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 flex items-center justify-center mb-3">
          <svg className="size-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </div>
        <p className={`text-sm ${headCls}`}>No matching items found</p>
        <p className={`text-xs ${subCls} mt-1`}>Try a different search or collection filter</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <div className="size-12 rounded-2xl bg-zinc-900/40 backdrop-blur-xl flex items-center justify-center mb-4 border border-zinc-800/40 shadow-lg">
        <svg className="size-6 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
        </svg>
      </div>
      <p className={`text-sm font-medium ${headCls}`}>Vault is Empty</p>
      <p className={`text-xs ${subCls} mt-1 max-w-[200px]`}>
        Right-click any tab or use the extension menu to save tabs
      </p>
    </div>
  )
}
