import { create } from 'zustand'
import { vaultDB, type VaultItem } from '../db/vaultDB'

const DEFAULT_COLLECTIONS = ['default', 'work', 'personal', 'archive']

type CollectionMap = Record<string, { name: string; color: string }>

interface VaultStore {
  items: VaultItem[]
  collections: CollectionMap
  collectionOrder: string[]
  searchQuery: string
  selectedCollection: string | null
  viewMode: 'list' | 'card'
  isLoading: boolean

  setSearchQuery: (query: string) => void
  setSelectedCollection: (collection: string | null) => void
  setViewMode: (mode: 'list' | 'card') => void
  fetchItems: () => Promise<void>
  deleteItem: (id: number) => Promise<void>
  moveToCollection: (itemId: number, collection: string) => Promise<void>
  addCollection: (name: string) => void
  refreshCollections: () => void
}

export const useVaultStore = create<VaultStore>((set, get) => ({
  items: [],
  collections: Object.fromEntries(
    DEFAULT_COLLECTIONS.map((name, i) => [
      name,
      { name, color: ['#7C3AED', '#3B82F6', '#F59E0B', '#10B981'][i] },
    ]),
  ),
  collectionOrder: DEFAULT_COLLECTIONS,
  searchQuery: '',
  selectedCollection: null,
  viewMode: 'list',
  isLoading: false,

  setSearchQuery: (query) => set({ searchQuery: query }),

  setSelectedCollection: (collection) => set({ selectedCollection: collection }),

  setViewMode: (mode) => set({ viewMode: mode }),

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
    set({ items })
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
}))
