import { vaultDB } from '../db/vaultDB'

export async function restoreTab(itemId: number): Promise<void> {
  const item = await vaultDB.vault_items.get(itemId)
  if (!item) return

  const tab = await chrome.tabs.create({ url: item.url, active: true })
  const tabId = tab.id
  if (!tabId) return

  await new Promise<void>((resolve) => {
    function handler(id: number, changeInfo: chrome.tabs.TabChangeInfo) {
      if (id === tabId && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(handler)
        resolve()
      }
    }
    chrome.tabs.onUpdated.addListener(handler)
  })

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      args: [item.scrollY],
      func: (targetScrollY: number) => {
        const start = Date.now()
        const MAX_WAIT = 3000
        const RETRY_MS = 200

        function scrollToTarget() {
          window.scrollTo({ top: targetScrollY, behavior: 'instant' })
        }

        function poll() {
          const body = document.body
          const doc = document.documentElement
          const maxScroll = Math.max(
            body?.scrollHeight ?? 0,
            doc?.scrollHeight ?? 0,
          )
          if (maxScroll >= targetScrollY + window.innerHeight || Date.now() - start >= MAX_WAIT) {
            scrollToTarget()
            return
          }
          scrollToTarget()
          setTimeout(poll, RETRY_MS)
        }

        scrollToTarget()
        setTimeout(poll, RETRY_MS)
      },
    })
  } catch {
    // scroll injection may fail on restricted pages
  }

  if (item.groupName) {
    try {
      const groupId = await chrome.tabs.group({ tabIds: tabId })
      await chrome.tabGroups.update(groupId, {
        title: item.groupName,
        color: (item.groupColor || 'grey') as chrome.tabGroups.ColorEnum,
      })
    } catch {
      // tab group creation may fail
    }
  }

  await vaultDB.vault_items.update(itemId, { lastViewed: Date.now() })
}
