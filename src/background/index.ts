import { vaultDB } from '../db/vaultDB'

const TAB_ACTIVITY_KEY = 'tabActivity'
const STALE_THRESHOLD = 2 * 60 * 60 * 1000
const MEMORY_PRESSURE_LIMIT = 50
const MEMORY_PRESSURE_ARCHIVE_COUNT = 5
const ALARM_NAME = 'cleanup-inactive-tabs'

async function getTabActivity(): Promise<Record<number, number>> {
  const result = await chrome.storage.local.get(TAB_ACTIVITY_KEY)
  return result[TAB_ACTIVITY_KEY] || {}
}

async function setTabActivity(activity: Record<number, number>): Promise<void> {
  await chrome.storage.local.set({ [TAB_ACTIVITY_KEY]: activity })
}

async function archiveTab(tabId: number): Promise<void> {
  try {
    const tab = await chrome.tabs.get(tabId)
    const url = tab.url || ''
    if (!url || url.startsWith('chrome://') || url.startsWith('brave://') || url.startsWith('about:')) {
      return
    }

    let groupName = ''
    let groupColor = ''
    if (tab.groupId && tab.groupId > 0) {
      try {
        const group = await chrome.tabGroups.get(tab.groupId)
        groupName = group.title || ''
        groupColor = group.color || ''
      } catch {
        // group may have been deleted
      }
    }

    let scrollY = 0
    let textPreview = ''
    try {
      const [result] = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          return {
            scrollY: window.scrollY || 0,
            textPreview: (document.body?.innerText || '').slice(0, 1000),
          }
        },
      })
      scrollY = result?.result?.scrollY ?? 0
      textPreview = result?.result?.textPreview ?? ''
    } catch {
      // scripting may fail on restricted pages
    }

    await vaultDB.vault_items.add({
      url,
      title: tab.title || '',
      favicon: tab.favIconUrl || '',
      groupName,
      groupColor,
      scrollY,
      textPreview,
      tags: [],
      collection: 'default',
      createdAt: Date.now(),
      lastViewed: Date.now(),
    })

    await chrome.tabs.remove(tabId)

    const activity = await getTabActivity()
    delete activity[tabId]
    await setTabActivity(activity)
  } catch (err) {
    console.error('archiveTab error:', err)
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'save-to-vault',
    title: 'Save to Vault',
    contexts: ['page'],
  })

  chrome.alarms.create(ALARM_NAME, { periodInMinutes: 5 })
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'save-to-vault' && tab?.id) {
    archiveTab(tab.id)
  }
})

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const activity = await getTabActivity()
  activity[activeInfo.tabId] = Date.now()
  await setTabActivity(activity)
})

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('brave://')) {
    const activity = await getTabActivity()
    activity[tabId] = Date.now()
    await setTabActivity(activity)
  }
})

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const activity = await getTabActivity()
  delete activity[tabId]
  await setTabActivity(activity)
})

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    await cleanupInactiveTabs()
  }
})

chrome.runtime.onStartup.addListener(() => {
  cleanupInactiveTabs()
})

chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-side-panel') {
    chrome.windows.getCurrent({}, (win) => {
      if (win?.id) chrome.sidePanel.open({ windowId: win.id })
    })
  }
})

chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  if (message.type === 'ARCHIVE_TAB' && message.tabId) {
    archiveTab(message.tabId)
  } else if (message.type === 'OPEN_SIDE_PANEL' && message.windowId) {
    chrome.sidePanel.open({ windowId: message.windowId })
  }
})

async function cleanupInactiveTabs(): Promise<void> {
  try {
    const tabs = await chrome.tabs.query({})
    const activity = await getTabActivity()
    const now = Date.now()

    cleanStaleActivityEntries(activity, tabs)

    if (tabs.length > MEMORY_PRESSURE_LIMIT) {
      const candidates = tabs
        .filter(t => t.id && !t.pinned && !t.audible)
        .map(t => ({
          tab: t,
          lastActive: activity[t.id!] || 0,
        }))
        .sort((a, b) => a.lastActive - b.lastActive)
        .slice(0, MEMORY_PRESSURE_ARCHIVE_COUNT)

      for (const { tab } of candidates) {
        if (tab.id) await archiveTab(tab.id)
      }
      return
    }

    for (const tab of tabs) {
      if (!tab.id) continue
      if (tab.pinned) continue
      if (tab.audible) continue

      const lastActive = activity[tab.id] || 0
      if (lastActive > 0 && now - lastActive > STALE_THRESHOLD) {
        await archiveTab(tab.id)
      }
    }
  } catch (err) {
    console.error('cleanupInactiveTabs error:', err)
  }
}

function cleanStaleActivityEntries(
  activity: Record<number, number>,
  openTabs: chrome.tabs.Tab[],
): void {
  const openIds = new Set(openTabs.map(t => t.id).filter(Boolean))
  for (const idStr of Object.keys(activity)) {
    const id = Number(idStr)
    if (!openIds.has(id)) {
      delete activity[id]
    }
  }
}
