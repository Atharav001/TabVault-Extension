import { vaultDB } from '../db/vaultDB'

export async function exportToMarkdown(): Promise<void> {
  const items = await vaultDB.vault_items.toArray()

  const grouped: Record<string, typeof items> = {}
  for (const item of items) {
    const collection = item.collection || 'Uncategorized'
    if (!grouped[collection]) grouped[collection] = []
    grouped[collection].push(item)
  }

  const lines: string[] = ['# MemoryVault Export', '']

  for (const [collection, collectionItems] of Object.entries(grouped)) {
    lines.push(`## ${collection}`)
    lines.push('')
    for (const item of collectionItems) {
      const title = item.title || 'Untitled'
      lines.push(`- [${title}](${item.url})`)
      if (item.textPreview) {
        const preview = item.textPreview.replace(/\n/g, ' ').slice(0, 200)
        lines.push(`  > ${preview}`)
      }
      lines.push('')
    }
  }

  const markdown = lines.join('\n')
  const dataUrl = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(markdown)

  await chrome.downloads.download({
    url: dataUrl,
    filename: 'MemoryVault_Export.md',
    saveAs: false,
  })
}
