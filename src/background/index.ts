import { vaultDB } from '../db/vaultDB'

const TAB_ACTIVITY_KEY = 'tabActivity'
const STALE_THRESHOLD = 2 * 60 * 60 * 1000
const ALARM_NAME = 'cleanup-inactive-tabs'
const UNDO_KEY = 'lastArchived'
const PENDING_KEY = 'pendingAutoArchive'
const NOTIFICATION_ID = 'auto-archive-pending'

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
  chrome.action.setBadgeText({ text: count > 0 ? (count > 99 ? '99+' : String(count)) : '' })
  chrome.action.setBadgeBackgroundColor({ color: '#0040a0' })
}

async function fetchFaviconBase64(favIconUrl: string): Promise<string> {
  if (!favIconUrl) return ''
  try {
    const response = await fetch(favIconUrl, { signal: AbortSignal.timeout(3000) })
    const blob = await response.blob()
    return await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  } catch {
    return ''
  }
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
  let domain = ''
  try { domain = new URL(url).hostname } catch {}
  await vaultDB.vault_items.add({
    url,
    title,
    favicon: '',
    faviconFallback: domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : '',
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

async function archiveTab(tabId: number): Promise<number | null> {
  if (!(await isExtensionEnabled())) return null
  try {
    const tab = await chrome.tabs.get(tabId)
    if (tab.pinned) return null
    const url = tab.url || ''
    if (!url || url.startsWith('chrome://') || url.startsWith('brave://') || url.startsWith('about:')) {
      return null
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

    const favicon = await fetchFaviconBase64(tab.favIconUrl || '')
    let domain = ''
    try { domain = new URL(url).hostname } catch {}
    const faviconFallback = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : ''

    const id = await vaultDB.vault_items.add({
      url,
      title: tab.title || '',
      favicon,
      faviconFallback,
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
    return id
  } catch (err) {
    console.error('archiveTab error:', err)
    return null
  }
}

async function archiveTabsBatch(
  tabIds: number[],
  collection?: string,
): Promise<number[]> {
  const ids: number[] = []
  for (const tabId of tabIds) {
    const id = await archiveTab(tabId)
    if (id !== null) ids.push(id)
  }
  if (collection) {
    for (const id of ids) {
      await vaultDB.vault_items.update(id, { collection })
    }
  }
  if (ids.length > 0) {
    await chrome.storage.local.set({ [UNDO_KEY]: { ids, count: ids.length, timestamp: Date.now() } })
    notifySidePanel({ type: 'TABS_ARCHIVED', ids, count: ids.length })
  }
  return ids
}

async function notifySidePanel(message: Record<string, unknown>): Promise<void> {
  try {
    const views = chrome.extension.getViews({ type: 'sidebar' })
    for (const view of views) {
      view.postMessage(message, '*')
    }
  } catch {
  }
  try {
    await chrome.runtime.sendMessage(message)
  } catch {
  }
}

async function createPendingNotification(count: number): Promise<void> {
  try {
    await chrome.notifications.create(NOTIFICATION_ID, {
      type: 'basic',
      iconUrl: 'public/icon128.png',
      title: 'TabVault',
      message: `${count} inactive tab${count === 1 ? '' : 's'} ready to archive`,
      priority: 1,
    })
  } catch {
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

  // Remove from pending if user interacts with the tab
  const stored = await chrome.storage.local.get(PENDING_KEY)
  if (stored[PENDING_KEY]) {
    const updated = stored[PENDING_KEY].filter((id: number) => id !== activeInfo.tabId)
    if (updated.length !== stored[PENDING_KEY].length) {
      await chrome.storage.local.set({ [PENDING_KEY]: updated })
    }
  }
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

  const stored = await chrome.storage.local.get(PENDING_KEY)
  if (stored[PENDING_KEY]) {
    const updated = stored[PENDING_KEY].filter((id: number) => id !== tabId)
      if (updated.length !== stored[PENDING_KEY].length) {
        await chrome.storage.local.set({ [PENDING_KEY]: updated })
        if (updated.length === 0) chrome.notifications.clear(NOTIFICATION_ID)
        notifySidePanel({
          type: 'PENDING_AUTO_ARCHIVE_REMOVE',
          tabId,
        })
      }
  }
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

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'open-side-panel') {
    const { panelOpen } = await chrome.storage.session.get('panelOpen')
    if (panelOpen) {
      await chrome.storage.session.set({ panelOpen: false })
      try { await chrome.runtime.sendMessage({ type: 'CLOSE_SIDE_PANEL' }) } catch {}
    } else {
      await chrome.storage.session.set({ panelOpen: true })
      const win = await chrome.windows.getCurrent()
      if (win?.id) chrome.sidePanel.open({ windowId: win.id })
    }
  }
})

chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId === NOTIFICATION_ID) {
    chrome.windows.getCurrent({}, (win) => {
      if (win?.id) chrome.sidePanel.open({ windowId: win.id })
    })
  }
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'ARCHIVE_TAB' && message.tabId) {
    archiveTab(message.tabId).then(sendResponse)
    return true
  } else if (message.type === 'ARCHIVE_TABS_BATCH' && Array.isArray(message.tabIds)) {
    archiveTabsBatch(message.tabIds, message.collection).then(sendResponse)
    return true
  } else if (message.type === 'OPEN_SIDE_PANEL' && message.windowId) {
    chrome.sidePanel.open({ windowId: message.windowId })
  } else if (message.type === 'UPDATE_BADGE') {
    updateBadge()
  } else if (message.type === 'GET_UNDO') {
    chrome.storage.local.get(UNDO_KEY, (r) => sendResponse(r[UNDO_KEY] || null))
    return true
  } else if (message.type === 'ARCHIVE_PENDING' && Array.isArray(message.tabIds)) {
    handleArchivePending(message.tabIds).then(sendResponse)
    return true
  } else if (message.type === 'SNOOZE_PENDING' && Array.isArray(message.tabIds)) {
    handleSnoozePending(message.tabIds).then(() => sendResponse(true))
    return true
  } else if (message.type === 'CLEAR_PENDING') {
    chrome.storage.local.remove(PENDING_KEY, () => sendResponse(true))
    return true
  } else if (message.type === 'DISMISS_PENDING' && Array.isArray(message.tabIds)) {
    handleDismissPending(message.tabIds).then(() => sendResponse(true))
    return true
  } else if (message.type === 'ARCHIVE_SELECTED' && Array.isArray(message.archiveIds)) {
    handleArchiveSelected(message.archiveIds, message.snoozeIds || []).then(sendResponse)
    return true
  }
})

async function handleArchivePending(tabIds: number[]): Promise<number[]> {
  const validIds: number[] = []
  for (const tabId of tabIds) {
    try {
      await chrome.tabs.get(tabId)
      validIds.push(tabId)
    } catch {
    }
  }
  const ids = await archiveTabsBatch(validIds)
  await chrome.storage.local.remove(PENDING_KEY)
  chrome.notifications.clear(NOTIFICATION_ID)
  return ids
}

async function handleSnoozePending(tabIds: number[]): Promise<void> {
  const activity = await getTabActivity()
  const now = Date.now()
  for (const tabId of tabIds) {
    activity[tabId] = now + 3600000
  }
  await setTabActivity(activity)
  await chrome.storage.local.remove(PENDING_KEY)
  chrome.notifications.clear(NOTIFICATION_ID)
}

async function handleDismissPending(tabIds: number[]): Promise<void> {
  const activity = await getTabActivity()
  const now = Date.now()
  for (const tabId of tabIds) {
    activity[tabId] = now + 10800000
  }
  await setTabActivity(activity)
  await chrome.storage.local.remove(PENDING_KEY)
  chrome.notifications.clear(NOTIFICATION_ID)
}

async function handleArchiveSelected(
  archiveIds: number[],
  snoozeIds: number[],
): Promise<{ archived: number[] }> {
  const archived: number[] = []
  for (const tabId of archiveIds) {
    const id = await archiveTab(tabId)
    if (id !== null) archived.push(id)
  }
  if (snoozeIds.length > 0) {
    const activity = await getTabActivity()
    const now = Date.now()
    for (const tabId of snoozeIds) {
      activity[tabId] = now + 3600000
    }
    await setTabActivity(activity)
  }
  if (archived.length > 0) {
    await chrome.storage.local.set({ [UNDO_KEY]: { ids: archived, count: archived.length, timestamp: Date.now() } })
    notifySidePanel({ type: 'TABS_ARCHIVED', ids: archived, count: archived.length })
  }
  await chrome.storage.local.remove(PENDING_KEY)
  chrome.notifications.clear(NOTIFICATION_ID)
  return { archived }
}

async function cleanupInactiveTabs(): Promise<void> {
  if (!(await isExtensionEnabled())) return
  try {
    const tabs = await chrome.tabs.query({})
    const activity = await getTabActivity()
    const now = Date.now()

    cleanStaleActivityEntries(activity, tabs)

    const stored = await chrome.storage.local.get(PENDING_KEY)
    const pendingIds: number[] = stored[PENDING_KEY] || []

    const stillPending: number[] = []
    for (const tabId of pendingIds) {
      try {
        const tab = await chrome.tabs.get(tabId)
        if (tab.pinned) continue
        stillPending.push(tabId)
      } catch {
      }
    }

    const staleTabs: chrome.tabs.Tab[] = []
    for (const tab of tabs) {
      if (!tab.id) continue
      if (tab.pinned) continue
      if (tab.audible) continue
      if (pendingIds.includes(tab.id)) continue

      const lastActive = activity[tab.id] || 0
      if (lastActive > 0 && now - lastActive > STALE_THRESHOLD) {
        staleTabs.push(tab)
      }
    }

    if (staleTabs.length === 0 && stillPending.length === 0) {
      await chrome.storage.local.remove(PENDING_KEY)
      chrome.notifications.clear(NOTIFICATION_ID)
      return
    }

    const mergedPending = [...stillPending, ...staleTabs.map(t => t.id!).filter(Boolean)]
    const uniquePending = [...new Set(mergedPending)]
    await chrome.storage.local.set({ [PENDING_KEY]: uniquePending })

    if (staleTabs.length > 0) {
      notifySidePanel({
        type: 'PENDING_AUTO_ARCHIVE',
        tabs: staleTabs.map(t => ({
          tabId: t.id!,
          title: t.title || 'Untitled',
          url: t.url || '',
        })),
      })
      createPendingNotification(uniquePending.length)
    } else if (stillPending.length > 0) {
      // Re-notify for tabs still pending (user may not have seen first notification)
      const reNotifyTabs = stillPending
        .map((id) => tabs.find((t) => t.id === id))
        .filter((t): t is chrome.tabs.Tab => !!t)
      if (reNotifyTabs.length > 0) {
        notifySidePanel({
          type: 'PENDING_AUTO_ARCHIVE',
          tabs: reNotifyTabs.map(t => ({
            tabId: t.id!,
            title: t.title || 'Untitled',
            url: t.url || '',
          })),
        })
        createPendingNotification(uniquePending.length)
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
