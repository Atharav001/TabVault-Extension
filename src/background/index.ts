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

async function isExtensionEnabled(): Promise<boolean> {
  const result = await chrome.storage.local.get('extensionEnabled')
  return result.extensionEnabled !== false
}

async function updateBadge(): Promise<void> {
  const count = await vaultDB.vault_items.count()
  chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' })
  chrome.action.setBadgeBackgroundColor({ color: '#333333' })
}

async function saveLinkToVault(url: string): Promise<void> {
  if (!(await isExtensionEnabled())) return
  let title = ''
  let textPreview = ''
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) })
    const html = await response.text()
    const doc = new DOMParser().parseFromString(html, 'text/html')
    title = doc.title || ''
    textPreview = (doc.body?.innerText || '').slice(0, 1000)
  } catch {
    title = url.replace(/^https?:\/\//, '').split('/')[0] || url
  }
  await vaultDB.vault_items.add({
    url,
    title,
    favicon: '',
    groupName: '',
    groupColor: '',
    scrollY: 0,
    textPreview,
    tags: [],
    collection: 'default',
    createdAt: Date.now(),
    lastViewed: Date.now(),
    tabIndex: -1,
    windowId: 0,
  })
  await updateBadge()
}

async function archiveTab(tabId: number): Promise<void> {
  if (!(await isExtensionEnabled())) return
  try {
    const tab = await chrome.tabs.get(tabId)
    if (tab.pinned) return
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
      tabIndex: tab.index,
      windowId: tab.windowId,
    })

    await chrome.tabs.remove(tabId)

    const activity = await getTabActivity()
    delete activity[tabId]
    await setTabActivity(activity)
    await updateBadge()
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
  chrome.contextMenus.create({
    id: 'save-link-to-vault',
    title: 'Save Link to Vault',
    contexts: ['link'],
  })
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: 5 })
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false })
  updateBadge()
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'save-to-vault' && tab?.id) {
    archiveTab(tab.id)
  } else if (info.menuItemId === 'save-link-to-vault' && info.linkUrl) {
    saveLinkToVault(info.linkUrl)
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
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false })
  cleanupInactiveTabs()
  updateBadge()
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
  } else if (message.type === 'UPDATE_BADGE') {
    updateBadge()
  }
})

async function cleanupInactiveTabs(): Promise<void> {
  if (!(await isExtensionEnabled())) return
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
