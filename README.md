<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT">
  <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg" alt="Platform">
  <img src="https://img.shields.io/badge/electron-35-blue.svg" alt="Electron">
</p>

<h1 align="center">ClipVault</h1>

<p align="center">
  <strong>Smart clipboard manager</strong> — search, categorize, and quick-paste your clipboard history.<br>
  A lightweight Electron app that runs in the background and springs to life with a keyboard shortcut.
</p>

---

## Features

- **Automatic clipboard tracking** — polls every 500ms, captures every copy
- **Smart categorization** — auto-detects code, URLs, emails, and plain text
- **Instant search** — real-time fuzzy search across all your clips
- **Global shortcut** — `Cmd+Shift+V` (Mac) / `Ctrl+Shift+V` (Win/Linux) opens the floating panel
- **Pin important clips** — star items to protect them from eviction
- **Keyboard-first** — arrow keys to navigate, Enter to copy+paste, Escape to dismiss
- **Dark mode** — matches your system appearance
- **Right-click menu** — context menu for copy, pin, delete
- **500 item capacity** — LRU eviction keeps things snappy (pinned items are safe)
- **Zero dependencies** — no cloud, no accounts, no network calls

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+Shift+V` / `Ctrl+Shift+V` | Toggle ClipVault window |
| `↑` / `↓` | Navigate clips |
| `Enter` | Copy selected clip and close |
| `Escape` | Close window |
| `/` | Focus search bar |

## Installation

### Download

Grab the latest release from the [Releases](https://github.com/katogatogato/clipvault/releases) page.

### Build from Source

```bash
git clone https://github.com/katogatogato/clipvault.git
cd clipvault
npm install
npm run build
npm start
```

### Package for Distribution

```bash
npm run dist
```

## Configuration

ClipVault stores its data in `~/.clipvault/history.json`. The maximum number of clips is 500. Pinned items are never evicted.

## Screenshots

```
┌─────────────────────────────────────────┐
│  CLIPVAULT                      🗑  ✕   │
│ ┌─────────────────────────────────────┐ │
│ │ 🔍  Search clips...            Esc  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│  TODAY                                  │
│  ┌──────────────────────────────────┐   │
│  │ 💻  const result = await fetch() │   │
│  │     .then(r => r.json())    2m   │ ★ │
│  │     ── code ──────────────────   │   │
│  ├──────────────────────────────────┤   │
│  │ 🔗  https://github.com/kato...  │   │
│  │                          15m  │ │   │
│  │     ── url ─────────────────── │   │
│  └──────────────────────────────────┘   │
│                                         │
│  YESTERDAY                              │
│  ┌──────────────────────────────────┐   │
│  │ 📎  Meeting notes from standup   │   │
│  │                          1d   │ │   │
│  │     ── text ────────────────── │   │
│  └──────────────────────────────────┘   │
│                                         │
│  4 clips    ↑↓ Navigate  Enter Copy     │
└─────────────────────────────────────────┘
```

## Architecture

```
src/
├── main/
│   ├── main.ts        Electron main process — window creation, IPC
│   ├── clipboard.ts   Clipboard polling and auto-categorization
│   ├── store.ts       JSON file storage with LRU eviction
│   └── shortcuts.ts   Global keyboard shortcut registration
├── renderer/
│   ├── index.html     Floating panel markup
│   ├── app.ts         Renderer — search, display, keyboard nav
│   └── styles.css     Dark theme, animations, layout
└── shared/
    └── types.ts       Shared TypeScript interfaces
```

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run in development
npm start

# Watch for changes
npm run dev
```

## Contributing

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT — see [LICENSE](LICENSE) for details.

Copyright (c) 2026 katogatogato
