<div align="center">
  <img src="public/icon.png" alt="TabVault Logo" width="100" style="border-radius: 20%;"/>
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

## Overview

TabVault helps you reclaim browser memory by automatically archiving inactive tabs and providing a beautiful side panel to search, restore, and organize your saved browsing sessions.

### Core Features

- **Automated Tab Archiving** — Periodically archives tabs inactive for 2+ hours via alarms. Memory pressure detection auto-archives the 5 oldest tabs when 50+ tabs are open.
- **One-Click Restoration** — Restore any vaulted tab with its original URL, scroll position, and tab group intact.
- **Drag-and-Drop Organization** — Sort saved items into custom collections using intuitive drag-and-drop.
- **Full-Text Search** — Instantly search across titles, URLs, tags, and text previews.
- **Markdown Export** — Export your entire vault grouped by collection as a Markdown file.
- **Context Menu Integration** — Right-click any page and select "Save to Vault."

## Tech Stack

| Technology | Purpose |
|---|---|
| [React 18](https://react.dev) | UI framework |
| [TypeScript 5](https://www.typescriptlang.org) | Type safety |
| [Vite 6](https://vitejs.dev) | Build tool & dev server |
| [Tailwind CSS 4](https://tailwindcss.com) | Utility-first styling |
| [Dexie.js](https://dexie.org) | IndexedDB wrapper for persistent local storage |
| [Zustand](https://github.com/pmndrs/zustand) | Lightweight state management |
| [@dnd-kit](https://dndkit.com) | Drag-and-drop for collection organization |
| [@tanstack/react-virtual](https://tanstack.com/virtual) | Virtual scrolling for 500+ item lists |
| [CRXJS Vite Plugin](https://crxjs.dev) | MV3 extension build pipeline |
| [Manifest V3](https://developer.chrome.com/docs/extensions/develop/migrate) | Extension architecture |

## Permissions

| Permission | Purpose |
|---|---|
| `sidePanel` | Display the vault UI in the browser side panel |
| `tabs` | Query, create, and close tabs |
| `tabGroups` | Restore tabs into named, colored groups |
| `alarms` | Run periodic cleanup (every 5 minutes) |
| `contextMenus` | Right-click "Save to Vault" |
| `scripting` | Inject scroll-restoration scripts |
| `storage` | Persist tab-activity tracking |
| `downloads` | Export vault as Markdown file |

## Project Structure

```
TabVault Extension/
├── index.html              # Vite entry HTML
├── manifest.json           # MV3 extension manifest
├── vite.config.ts          # CRXJS + React + Tailwind plugins
├── tsconfig.json           # TypeScript configuration
├── public/
│   └── icon.png            # Extension icon
├── src/
│   ├── background/
│   │   └── index.ts        # Service worker: archiving, alarms, context menus
│   ├── db/
│   │   └── vaultDB.ts      # Dexie database schema
│   ├── lib/
│   │   ├── restore.ts      # Tab restoration with scroll & group injection
│   │   └── export.ts       # Markdown export utility
│   ├── sidepanel/
│   │   ├── Panel.tsx        # Main layout & DnD context
│   │   ├── SearchBar.tsx    # Full-text search
│   │   ├── Collections.tsx  # Droppable collection pills
│   │   ├── VaultItem.tsx    # Draggable item card
│   │   └── VirtualList.tsx  # Virtual scrolling list
│   └── store/
│       └── useVaultStore.ts # Zustand state store
└── package.json
```

## Getting Started

```bash
# Clone the repository
git clone https://github.com/Atharav001/TabVault-Extension.git
cd TabVault-Extension

# Install dependencies
npm install

# Start development server (with HMR)
npm run dev

# Production build
npm run build
```

### Loading the Extension

1. Open `brave://extensions/` (or `chrome://extensions/`)
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `dist/` directory
4. Pin the extension icon to your toolbar and click it to open the side panel

## Architecture

- **Background Service Worker** (`src/background/index.ts`) handles periodic alarms (5-minute intervals), context menu commands, tab-activity tracking, and memory pressure detection (>50 tabs triggers immediate archiving of oldest 5).
- **Dexie Database** (`src/db/vaultDB.ts`) stores all archived items locally in IndexedDB with indexed fields for fast querying.
- **Zustand Store** (`src/store/useVaultStore.ts`) bridges Dexie to the React UI, providing reactive state for items, collections, search, and filters.
- **Side Panel UI** (`src/sidepanel/`) uses a virtualized list (`@tanstack/react-virtual`) and drag-and-drop (`@dnd-kit/core`) for smooth performance with large vaults.

---

<div align="center">
  <i>Built for deep focus.</i><br/>
  <b>#Productivity</b> • <b>#BrowserExtension</b> • <b>#TabManagement</b> • <b>#PKM</b>
</div>
