<div align="center">
  <img src="public/icon.png" alt="TabVault" width="80" style="border-radius: 20px;">
  <h1>TabVault</h1>
  <p><i>Automatically archive inactive tabs, restore them with scroll position & groups intact, and organize everything in a beautiful side panel.</i></p>

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

## Features

- **Auto-archive** — Every **5min**, tabs inactive for **2+ hours** are saved & closed. Pinned tabs excluded.
- **Memory pressure** — When **50+ tabs** are open, the **5 oldest** are immediately archived.
- **Restore with precision** — Re-opens the URL, scrolls to the saved position (retries lazy content for **3s**), and recreates the original tab group with name & color.
- **Side panel** — Search, filter by collection, switch between list & card (2-column) views. Drag items onto collections to organize.
- **Popup** — Archive current tab, all unpinned tabs, or open the side panel from the toolbar icon.
- **Export** — Save your vault as Markdown grouped by collection.
- **Virtual scrolling** — Handles **500+ items** smoothly via `@tanstack/react-virtual`.

## Usage

| Action | How |
|---|---|
| Archive current tab | Toolbar popup → "Send Current Tab" |
| Archive all tabs | Toolbar popup → "Send All Tabs" |
| Open side panel | `Ctrl+Shift+V` / `⌘+Shift+V` or popup → "Open Side Panel View" |
| Save from right-click | Right-click any page → "Save to Vault" |
| Restore | Click ↻ on any vault item |
| Organize | Drag items onto collection pills |
| Toggle view | List / card toggle next to search bar |
| Export | "Export to Markdown" at bottom of side panel or in Settings |

## Install

```bash
git clone https://github.com/Atharav001/TabVault-Extension.git
cd TabVault-Extension
npm install
npm run build
```

Load `dist/` as an unpacked extension in Brave (`brave://extensions/`, Developer mode).

## Tech

React 18 • TypeScript 5 • Vite 6 • Tailwind 4 • Dexie.js • Zustand • @dnd-kit • @tanstack/react-virtual • CRXJS • Manifest V3

---

<div align="center">
  <b>#TabManagement</b> • <b>#Productivity</b> • <b>#BrowserExtension</b>
</div>
