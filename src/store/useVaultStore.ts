import { create } from 'zustand'
import { vaultDB, type VaultItem } from '../db/vaultDB'
import { restoreTab } from '../lib/restore'

const DEFAULT_COLLECTIONS = ['default']

type CollectionMap = Record<string, { name: string; color: string }>

interface ToastState {
  message: string
  undoIds: number[]
}

export interface PendingTab {
  tabId: number
  title: string
  url: string
}

interface VaultStore {
  items: VaultItem[]
  collections: CollectionMap
  collectionOrder: string[]
  searchQuery: string
  selectedCollection: string | null
  viewMode: 'list' | 'card'
  listColumns: 'auto' | '1' | '2'
  isLoading: boolean
  selectedIds: number[]
  theme: 'dark' | 'light'
  toast: ToastState | null
  pendingAutoArchive: PendingTab[]

  setSearchQuery: (query: string) => void
  setSelectedCollection: (collection: string | null) => void
  setViewMode: (mode: 'list' | 'card') => void
  setListColumns: (mode: 'auto' | '1' | '2') => void
  fetchItems: () => Promise<void>
  deleteItem: (id: number) => Promise<void>
  moveToCollection: (itemId: number, collection: string) => Promise<void>
  addCollection: (name: string) => void
  renameCollection: (oldName: string, newName: string) => Promise<void>
  refreshCollections: () => void
  toggleSelect: (id: number) => void
  selectAll: (ids: number[]) => void
  clearSelection: () => void
  bulkDelete: () => Promise<void>
  bulkMoveToCollection: (collection: string) => Promise<void>
  bulkOpenSelected: () => Promise<void>
  setTheme: (theme: 'dark' | 'light') => void
  showToast: (message: string, undoIds: number[]) => void
  clearToast: () => void
  undoArchive: () => Promise<void>
  setPendingAutoArchive: (tabs: PendingTab[]) => void
  clearPendingAutoArchive: () => void
  archivePendingTabs: () => Promise<void>
  snoozePendingTabs: () => Promise<void>
  dismissPendingTabs: () => Promise<void>
}

export const useVaultStore = create<VaultStore>((set, get) => ({
  items: [],
  collections: Object.fromEntries(
    DEFAULT_COLLECTIONS.map((name, i) => [
      name,
      { name, color: ['#7C3AED'][i] },
    ]),
  ),
  collectionOrder: DEFAULT_COLLECTIONS,
  searchQuery: '',
  selectedCollection: null,
  viewMode: 'list',
  listColumns: 'auto',
  isLoading: false,
  selectedIds: [],
  theme: 'dark',
  toast: null,
  pendingAutoArchive: [],

  setSearchQuery: (query) => set({ searchQuery: query }),

  setSelectedCollection: (collection) => set({ selectedCollection: collection, selectedIds: [] }),

  setViewMode: (mode) => {
    set({ viewMode: mode })
    chrome.storage.local.set({ viewMode: mode })
  },
  setListColumns: (mode) => {
    set({ listColumns: mode })
    chrome.storage.local.set({ listColumns: mode })
  },

  fetchItems: async () => {
    set({ isLoading: true })
    try {
      const items = await vaultDB.vault_items.toArray()
      set({ items, isLoading: false })
      get().refreshCollections()
    } catch {
      set({ isLoading: false })
    }
  },

  deleteItem: async (id) => {
    await vaultDB.vault_items.delete(id)
    const items = get().items.filter((i) => i.id !== id)
    set({ items, selectedIds: get().selectedIds.filter((sid) => sid !== id) })
    chrome.runtime.sendMessage({ type: 'UPDATE_BADGE' })
  },

  moveToCollection: async (itemId, collection) => {
    await vaultDB.vault_items.update(itemId, { collection })
    const items = get().items.map((i) =>
      i.id === itemId ? { ...i, collection } : i,
    )
    set({ items })
  },

  addCollection: (name) => {
    const { collections, collectionOrder } = get()
    if (collections[name]) return
    set({
      collections: {
        ...collections,
        [name]: { name, color: '#6B7280' },
      },
      collectionOrder: [...collectionOrder, name],
    })
  },

  renameCollection: async (oldName, newName) => {
    if (oldName === newName || !newName.trim()) return
    const { collections, collectionOrder } = get()
    if (collections[newName]) return
    const color = collections[oldName]?.color || '#6B7280'
    const updated = { ...collections, [newName]: { name: newName, color }, [oldName]: undefined as unknown as typeof collections[string] }
    delete updated[oldName]
    const items = get().items.map((i) =>
      i.collection === oldName ? { ...i, collection: newName } : i,
    )
    await vaultDB.vault_items.where('collection').equals(oldName).modify({ collection: newName })
    set({
      collections: updated,
      collectionOrder: collectionOrder.map((n) => (n === oldName ? newName : n)),
      items,
      selectedCollection: get().selectedCollection === oldName ? newName : get().selectedCollection,
    })
  },

  refreshCollections: () => {
    const { collections, collectionOrder } = get()
    const itemCollections = new Set(
      get().items.map((i) => i.collection).filter(Boolean),
    )
    const merged = { ...collections }
    const mergedOrder = [...collectionOrder]

    for (const name of itemCollections) {
      if (!merged[name]) {
        merged[name] = { name, color: '#6B7280' }
        mergedOrder.push(name)
      }
    }

    set({ collections: merged, collectionOrder: mergedOrder })
  },

  toggleSelect: (id) => {
    const { selectedIds } = get()
    if (selectedIds.includes(id)) {
      set({ selectedIds: selectedIds.filter((sid) => sid !== id) })
    } else {
      set({ selectedIds: [...selectedIds, id] })
    }
  },

  selectAll: (ids) => set({ selectedIds: ids }),

  clearSelection: () => set({ selectedIds: [] }),

  bulkDelete: async () => {
    const { selectedIds } = get()
    await vaultDB.vault_items.bulkDelete(selectedIds)
    const items = get().items.filter((i) => i.id && !selectedIds.includes(i.id))
    set({ items, selectedIds: [] })
    chrome.runtime.sendMessage({ type: 'UPDATE_BADGE' })
  },

  bulkMoveToCollection: async (collection) => {
    const { selectedIds } = get()
    const ids = selectedIds.filter(Boolean)
    await Promise.all(ids.map((id) => vaultDB.vault_items.update(id, { collection })))
    const items = get().items.map((i) =>
      i.id && selectedIds.includes(i.id) ? { ...i, collection } : i,
    )
    set({ items, selectedIds: [] })
  },

  bulkOpenSelected: async () => {
    const { selectedIds, items } = get()
    const selected = items.filter(i => i.id && selectedIds.includes(i.id))
    const restored: number[] = []
    for (const item of selected) {
      if (item.id) {
        try { await restoreTab(item.id); restored.push(item.id) } catch {}
      }
    }
    await vaultDB.vault_items.bulkDelete(restored)
    set({ selectedIds: [] })
    chrome.runtime.sendMessage({ type: 'UPDATE_BADGE' })
    get().fetchItems()
  },

  setTheme: (theme) => set({ theme }),

  showToast: (message, undoIds) => {
    set({ toast: { message, undoIds } })
    setTimeout(() => {
      if (get().toast?.undoIds === undoIds) set({ toast: null })
    }, 10000)
  },

  clearToast: () => set({ toast: null }),

  undoArchive: async () => {
    const { toast } = get()
    if (!toast) return
    const restored: number[] = []
    for (const id of toast.undoIds) {
      try { await restoreTab(id); restored.push(id) } catch {}
    }
    await vaultDB.vault_items.bulkDelete(restored)
    set({ toast: null })
    chrome.runtime.sendMessage({ type: 'UPDATE_BADGE' })
    get().fetchItems()
  },

  setPendingAutoArchive: (tabs) => set({ pendingAutoArchive: tabs }),

  clearPendingAutoArchive: () => set({ pendingAutoArchive: [] }),

  archivePendingTabs: async () => {
    const { pendingAutoArchive } = get()
    if (pendingAutoArchive.length === 0) return
    const tabIds = pendingAutoArchive.map(t => t.tabId)
    try {
      const ids: number[] | undefined = await chrome.runtime.sendMessage({ type: 'ARCHIVE_PENDING', tabIds })
      if (ids) {
        if (ids.length > 0) {
          get().showToast(`Archived ${ids.length} inactive tabs`, ids)
          get().fetchItems()
        }
        set({ pendingAutoArchive: [] })
      }
    } catch {
      // message failed — keep pending list so user can retry
    }
  },

  snoozePendingTabs: async () => {
    const { pendingAutoArchive } = get()
    if (pendingAutoArchive.length === 0) return
    const tabIds = pendingAutoArchive.map(t => t.tabId)
    try {
      const ok = await chrome.runtime.sendMessage({ type: 'SNOOZE_PENDING', tabIds })
      if (ok) set({ pendingAutoArchive: [] })
    } catch {
    }
  },

  dismissPendingTabs: async () => {
    const { pendingAutoArchive } = get()
    if (pendingAutoArchive.length === 0) return
    const tabIds = pendingAutoArchive.map(t => t.tabId)
    try {
      const ok = await chrome.runtime.sendMessage({ type: 'DISMISS_PENDING', tabIds })
      if (ok) set({ pendingAutoArchive: [] })
    } catch {
    }
  },
}))
