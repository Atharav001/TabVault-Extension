<div align="center">
  <img src="public/icon128.png" alt="TabVault" width="80" style="border-radius: 20px;">
  <h1>TabVault</h1>
  <p><i>Intelligent tab archiving & session management for your browser.</i></p>

  <p>
    <a href="#features">Features</a> •
    <a href="#usage">Usage</a> •
    <a href="#install">Install</a> •
    <a href="#tech">Tech</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React 18"/>
    <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript"/>
    <img src="https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite 6"/>
    <img src="https://img.shields.io/badge/Dexie-4-4B8BBE?style=flat-square&logo=javascript&logoColor=white" alt="Dexie"/>
    <img src="https://img.shields.io/badge/Zustand-5-DF5A3C?style=flat-square&logo=react&logoColor=white" alt="Zustand"/>
    <img src="https://img.shields.io/badge/MV3-4285F4?style=flat-square&logo=google-chrome&logoColor=white" alt="Manifest V3"/>
  </p>
</div>

---

TabVault automatically archives inactive tabs, preserves scroll position and tab groups, and organizes everything in a premium glassmorphism side panel — so your browser stays lean without losing context.

## Features

**Archive & Restore** — Inactive tabs are auto-closed after 2 hours (configurable alarm every 5min). Memory pressure mode archives the 5 oldest tabs when 50+ are open. Restore re-opens at the exact scroll position with tab group name & color intact.

**Session Snapshots** — One-click "Snapshot Today" archives every tab in your current window with a `Session:` date label. All sessions appear as bold purple headers in the vault, making it easy to revisit past browsing sessions.

**Bulk Actions** — Multi-select items with checkboxes, then delete, move to collection, or restore in bulk. Keyboard shortcuts: `Delete` to remove, `R` to restore, `Cmd/Ctrl+A` to select all filtered items.

**Undo Protection** — Mass-archived tabs trigger a toast with "Undo" — click within 10 seconds to restore everything and remove from the vault.

**Side Panel** — Search, filter by collection, switch between list and card views. Drag items onto collection pills to organize. Items grouped by date headers (Today, Yesterday, date) with session snapshots highlighted in purple.

**Theme** — Dark mode (default) and a premium light mode with frosted glass aesthetics. Toggle in Settings.

**Export** — Download your entire vault as a Markdown file grouped by collection.

**Live Badge** — The toolbar icon shows the current vault count, updating in real time as tabs are archived or restored.

**Right-Click** — Save any page or link directly to the vault without opening it.

**Pinned Tab Safe** — Pinned tabs are never archived or closed at any level.

## Usage

| Action | How |
|---|---|
| Archive current tab | Toolbar popup → "Send Current Tab" |
| Archive all tabs in window | Toolbar popup → "Send Current Window" |
| Archive all windows | Toolbar popup → "Send All Open Windows" |
| Snapshot session | Toolbar popup or side panel → "Snapshot Today" |
| Open side panel | `Ctrl+Shift+V` / `⌘+Shift+V` or popup → "Open Side Panel View" |
| Save page (right-click) | Right-click any page → "Save to Vault" |
| Save link (right-click) | Right-click any link → "Save Link to Vault" |
| Restore | Click ↻ icon on any vault item |
| Bulk select | Checkbox on items → floating action bar |
| Undo archive | Toast → "Undo" within 10 seconds |
| Organize | Drag items onto collection pills |
| Toggle view | List / card toggle next to search bar |
| Settings | Gear icon in side panel or popup → "Settings" |
| Export | "Export to Markdown" at bottom of side panel |

## Install

```bash
git clone https://github.com/Atharav001/TabVault-Extension.git
cd TabVault-Extension
npm install
npm run build
```

Load `dist/` as an unpacked extension in Chrome / Brave (`chrome://extensions/`, Developer mode).

## Tech

**Stack:** React 18 · TypeScript 5 · Vite 6 · Tailwind 4 · Dexie.js · Zustand

**Libraries:** @dnd-kit (drag & drop) · @tanstack/react-virtual (virtualized list) · CRXJS (build)

**Runtime:** Manifest V3 · Service Worker · chrome.tabs · chrome.sidePanel · chrome.contextMenus · chrome.scripting · chrome.alarms · chrome.storage · chrome.downloads

---

<div align="center">
  <b>#TabManagement</b> • <b>#Productivity</b> • <b>#BrowserExtension</b>
</div>
