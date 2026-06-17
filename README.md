<div align="center">
  <img src="public/icon.png" alt="TabVault Logo" width="100" style="border-radius: 24px; box-shadow: 0 8px 32px rgba(0,0,0,0.5);"/>
  <h1>TabVault Extension</h1>
  <p><i>Intelligent tab archiving, restoration, and personal knowledge management for Brave & Chromium browsers.</i></p>

  <p>
    <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React 18"/>
    <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
    <img src="https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite 6"/>
    <img src="https://img.shields.io/badge/Tailwind-4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind 4"/>
    <img src="https://img.shields.io/badge/Manifest-V3-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white" alt="MV3"/>
    <img src="https://img.shields.io/badge/Dexie.js-4.0-4B8BBE?style=for-the-badge&logo=javascript&logoColor=white" alt="Dexie.js"/>
    <img src="https://img.shields.io/badge/Zustand-5-DF5A3C?style=for-the-badge&logo=react&logoColor=white" alt="Zustand"/>
  </p>
</div>

---

## What It Does

TabVault automatically reclaims browser memory by archiving inactive tabs and providing a beautiful side panel to search, restore, and organize your saved browsing sessions. It's built for users who keep 50+ tabs open and need a smarter way to manage them.

### Core Capabilities

| Capability | How It Works |
|---|---|
| **Automated Tab Archiving** | Every **5 minutes**, runs a cleanup cycle. Tabs inactive for **2+ hours** are automatically saved to the vault and closed |
| **Memory Pressure Detection** | When **50+ tabs** are open, immediately archives the **5 oldest inactive** tabs to prevent slowdowns |
| **Context Menu Save** | Right-click any page → "Save to Vault" to instantly archive a single tab |
| **Popup Quick Actions** | Click the toolbar icon to archive the current tab, all tabs in the window, open the side panel, or access settings |
| **One-Click Restoration** | Each vaulted item shows a restore button. Clicking re-opens the URL in a new tab, scrolls to the exact position, and re-creates the original tab group |
| **Smart Scroll Restoration** | After creating a restored tab, waits for the page to fully load, then scrolls to the saved position. If lazy content hasn't loaded yet, retries every **200ms** for up to **3 seconds** |
| **Tab Group Recovery** | If a saved tab belonged to a group, the restored tab is placed in a new group with the same title and color |
| **Keyboard Shortcut** | Press `Ctrl+Shift+V` (`⌘+Shift+V` on Mac) to instantly open the side panel from any window |

### Data It Captures Per Tab

| Field | What's Stored |
|---|---|
| **URL** | Full page URL |
| **Title** | Page title (shown in full in list view) |
| **Favicon** | Site icon for visual identification |
| **Scroll Position** | Exact `window.scrollY` when archived |
| **Text Preview** | First **1,000 characters** of the page body text |
| **Tab Group** | Group name and color (if the tab was in a group) |
| **Tags** | User-defined tags for organization |
| **Collection** | Categorized into folders (default, work, personal, archive, or custom) |
| **Timestamps** | Created at and last viewed dates |

## Architecture & Numbers

```
┌─────────────────────────────────────────────────────────┐
│                    Background SW                         │
│  ┌─────────────┐  ┌────────────┐  ┌──────────────────┐  │
│  │ Tab Activity │  │   Alarms   │  │  Context Menus   │  │
│  │  Tracking    │  │ Every 5min │  │  Save to Vault   │  │
│  └─────────────┘  └────────────┘  └──────────────────┘  │
│         │               │                    │           │
│         ▼               ▼                    ▼           │
│  ┌──────────────────────────────────────────────────┐   │
│  │              archiveTab(tabId)                    │   │
│  │  1. chrome.tabs.get → url, title, groupId         │   │
│  │  2. chrome.tabGroups.get → name, color            │   │
│  │  3. chrome.scripting.executeScript → scrollY,     │   │
│  │     textPreview (first 1000 chars)                 │   │
│  │  4. vaultDB.vault_items.add()                     │   │
│  │  5. chrome.tabs.remove(tabId) ⚠ kills the tab     │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│                    Dexie (IndexedDB)                     │
│  ┌──────────────────────────────────────────────────┐   │
│  │  vault_items (auto-increment id)                  │   │
│  │  Indexed on: url, title, groupName, collection,   │   │
│  │  createdAt, lastViewed, *tags (multi-entry)       │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│                  Side Panel UI                           │
│  ┌─────────┐ ┌───────────┐ ┌────────────────────────┐  │
│  │ Zustand │ │ @dnd-kit  │ │ @tanstack/react-virtual │  │
│  │ Store   │ │ Drag/Drop │ │ Virtual list (500+)     │  │
│  └─────────┘ └───────────┘ └────────────────────────┘  │
│  List view (compact)   │   Card view (2-column grid)    │
└─────────────────────────────────────────────────────────┘
```

### Key Thresholds

| Setting | Value | Description |
|---|---|---|
| Cleanup interval | **5 minutes** | How often the alarm fires to check for stale tabs |
| Stale threshold | **2 hours** (7,200,000 ms) | A tab is considered inactive if not activated for this long |
| Memory pressure limit | **50 tabs** | When total open tabs exceed this, emergency archiving triggers |
| Batch archive count | **5 tabs** | Number of oldest inactive tabs to archive under memory pressure |
| Scroll retry interval | **200 ms** | How often to re-check page height for lazy-loaded content |
| Scroll max wait | **3 seconds** (3,000 ms) | Maximum time to wait for lazy content before stopping |
| Text preview length | **1,000 characters** | Maximum characters stored from page body text |
| Virtual list overscan | **5 rows** (list) / **3 rows** (card) | Items rendered outside the visible viewport for smooth scrolling |

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **UI Framework** | React | 18.3 |
| **Language** | TypeScript | 5.7 |
| **Build Tool** | Vite | 6.4 |
| **CSS** | Tailwind CSS | 4.1 |
| **Database** | Dexie.js (IndexedDB) | 4.0 |
| **State Management** | Zustand | 5.0 |
| **Drag & Drop** | @dnd-kit/core | 6.3 |
| **Virtual Scrolling** | @tanstack/react-virtual | 3.14 |
| **Build Plugin** | @crxjs/vite-plugin (MV3) | 2.6 |
| **Extension API** | Manifest V3 | — |

## Permissions

| Permission | Purpose |
|---|---|
| `sidePanel` | Display the vault UI in the browser side panel |
| `tabs` | Query, create, and close tabs |
| `tabGroups` | Restore tabs into named, colored groups |
| `alarms` | Run periodic cleanup every **5 minutes** |
| `contextMenus` | Right-click "Save to Vault" |
| `scripting` | Inject scroll-restoration and text-extraction scripts |
| `storage` | Persist tab-activity tracking map (`chrome.storage.local`) |
| `downloads` | Export vault as Markdown file to Downloads folder |

## Project Structure

```
TabVault Extension/
├── popup.html                # Popup entry (toolbar icon click)
├── index.html                # Side panel entry
├── manifest.json             # MV3 extension manifest
├── vite.config.ts            # CRXJS + React + Tailwind plugins
├── tsconfig.json             # TypeScript strict config
├── public/
│   └── icon.png              # Extension icon
├── src/
│   ├── background/
│   │   └── index.ts          # Service worker: archiveTab, alarms, context menus, commands
│   ├── db/
│   │   └── vaultDB.ts        # Dexie schema: vault_items table with 13 fields
│   ├── lib/
│   │   ├── restore.ts        # Tab restoration with scroll injection & group recovery
│   │   └── export.ts         # Markdown export grouped by collection
│   ├── sidepanel/
│   │   ├── Panel.tsx          # Main layout with DnD context, view toggle, empty state
│   │   ├── SearchBar.tsx      # Full-text search + list/card view toggle
│   │   ├── Collections.tsx    # Droppable collection pills (modern tab style)
│   │   ├── VaultItem.tsx      # ListItem (full title) + CardItem (compact 2-col)
│   │   ├── VirtualList.tsx    # Virtual scrolling for 500+ items
│   │   ├── EmptyState.tsx     # Empty vault illustration
│   │   └── SettingsView.tsx   # Keyboard shortcut info, export button
│   ├── popup/
│   │   ├── main.tsx           # Popup React entry
│   │   └── Popup.tsx          # 4 action buttons with SVG icons
│   └── store/
│       └── useVaultStore.ts   # Zustand store: items, collections, viewMode, Dexie CRUD
└── package.json
```

## Getting Started

```bash
# Clone the repository
git clone https://github.com/Atharav001/TabVault-Extension.git
cd TabVault-Extension

# Install dependencies
npm install

# Development mode (with HMR for side panel + popup + background)
npm run dev

# Production build
npm run build
```

### Loading the Extension in Brave

1. Open `brave://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked** and select the `dist/` directory
4. Pin the extension icon to your toolbar

### Usage

| Action | How |
|---|---|
| **Open popup** | Click the toolbar icon |
| **Archive current tab** | Popup → "Send Current Tab to Vault" |
| **Archive all tabs** | Popup → "Send All Tabs to Vault" |
| **Open side panel** | Popup → "Open Side Panel View" or press `Ctrl+Shift+V` |
| **Save from context menu** | Right-click any page → "Save to Vault" |
| **Restore a tab** | Click ↻ on any vault item (side panel) |
| **Organize** | Drag items onto collection pills |
| **Switch view** | Toggle list/card icons next to the search bar |
| **Export** | Click "Export to Markdown" at the bottom of the side panel or in Settings |

---

<div align="center">
  <i>Built for deep focus.</i><br/>
  <b>#Productivity</b> • <b>#BrowserExtension</b> • <b>#TabManagement</b> • <b>#PKM</b>
</div>
