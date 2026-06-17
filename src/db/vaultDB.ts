import Dexie, { type EntityTable } from 'dexie'

export interface VaultItem {
  id?: number
  url: string
  title: string
  favicon: string
  groupName: string
  groupColor: string
  scrollY: number
  textPreview: string
  tags: string[]
  collection: string
  createdAt: number
  lastViewed: number
}

const vaultDB = new Dexie('MemoryVault') as Dexie & {
  vault_items: EntityTable<VaultItem, 'id'>
}

vaultDB.version(1).stores({
  vault_items: '++id, url, title, groupName, collection, createdAt, lastViewed, *tags',
})

export { vaultDB }
