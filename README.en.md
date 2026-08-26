# DSH Version Detection & Display Plugin | dsh-sm-version-display

[ 中文文档 ](./README.md) | [ English doc ](./README.en.md)

GitHub Repository: [https://github.com/hjj345/dsh-sm-version-display](https://github.com/hjj345/dsh-sm-version-display)
npm Repository: [https://www.npmjs.com/package/@hjj345345/dsh-sm-version-display](https://www.npmjs.com/package/@hjj345345/dsh-sm-version-display)

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Node](https://img.shields.io/badge/Node.js-%3E%3D20-brightgreen.svg)
![Version](https://img.shields.io/badge/Version-v1.0-blue.svg)
![dsh](https://img.shields.io/badge/dsh-%3E%3D0.1.1--rc.2-orange.svg)
![Platform](https://img.shields.io/badge/Platform-Web-lightgrey.svg)
![Status](https://img.shields.io/badge/Status-Stable-green.svg)

---

## Introduction

`dsh-sm-version-display` (npm package name `dsh-sm-version-display`) is a **client + host dual-half plugin** for the DeepSeek Harness (dsh) Web surface. It shows the currently installed dsh version in a rounded card above the Settings button at the bottom of the sidebar, and automatically checks the npm registry for the latest version:

- No update available: `v0.1.1-rc.2 (Latest)`
- Update available: `v0.1.1-rc.2 (Update available: v0.1.1-rc.3)`

The version is **read at runtime**, so after a dsh upgrade the card automatically shows the new version without touching the plugin. The plugin lives in the user's web profile — a **persistent extension** under dsh's official plugin mechanism.

## Features

- Version card: rounded rectangle (12px radius), occupies its own full row, directly above the Settings button;
- Update detection: automatic checks of the npm registry on page load + every 30 minutes + on window focus / returning to the foreground (focus refresh is throttled to 5 minutes to avoid spamming the registry);
- Semantic comparison: built-in lightweight semver comparator correctly handles cases such as `0.1.1-rc.2` vs `0.1.1-rc.3` and RC vs release versions;
- Responsive layout: card text wraps automatically when width is insufficient (`overflow-wrap: anywhere`); when the sidebar collapses to the 56px rail, a round version icon is shown instead of a blank space;
- Theme aware: uses only dsh design-system variables (`--dsw-alias-*`, `--ds-font-family-code`), automatically adapting to light / dark themes;
- Bilingual: Simplified Chinese / English follows the dsh UI language automatically;
- Hover tooltip: hovering the card or the rail icon shows a tooltip with the **bold** plugin English name `dsh-sm-version-display` and the current version text;
- Manual refresh: a dsh-native-style "Refresh" button sits at the rightmost side of the card (light mode = black fill + white text, automatically adapted in dark mode); clicking it performs a real npm registry check; while checking, the button switches to a spinning loading icon;
- Result toast: after a check completes, a dsh-native Toast appears (horizontally centered near the top of the page, auto-dismisses after 4 seconds); no update = green success icon; update available = blue info icon showing both the current and the latest version; check failure = red error icon;
- Upgrade auto-follow: the host half reads the installed `@deepseek-ai/dsh` version on every page render, so after a dsh upgrade and restart the card shows the new version with zero maintenance.

## Preview

```text
┌──────────────────────────────┐
│ ☰  DSH Local Build  29b22c5  │
│ ＋ New Session               │
│ (Session list…)              │
│                              │
│ [Plugins]                    │ ← sidebar.footer.action (cordis)
│ ┌──────────────────────────┐ │
│ │ v0.1.1-rc.2 (Latest) [↻] │ │ ← This plugin's card (own row)
│ └──────────────────────────┘ │
│ ⚙ Settings                   │
└──────────────────────────────┘
```

## Installation

### Option 1: Official plugin command (recommended, auto-mount)

```bash
dsh plugin --profile web add dsh-sm-version-display
```

### Option 2: Link a local development directory (used by this project)

In `~/.dsh/profiles/web/`'s `package.json`:

```json
{
  "dependencies": {
    "dsh-sm-version-display": "file:D:/android-project/dsh-sm-version-display-2026.08.23"
  },
  "dsh": {
    "profile": {
      "bundles": ["...", "dsh-sm-version-display"]
    }
  }
}
```

Then create a junction in `~/.dsh/profiles/web/node_modules/` pointing to the development directory, and **restart `dsh web`** to activate.

> Note: a restart of the `dsh web` service is required after installation (plugins are loaded by the bundle scan at startup).

## How It Works

```text
┌─────────────────────────────── dsh process (host) ───────────────────────────┐
│                                                                              │
│  dsh-sm-version-display/lib/index.js (host half)                              │
│    ├─ subscribes to the webserver/index-inject event                          │
│    └─ on every index.html render, reads the version of                       │
│       @deepseek-ai/dsh/package.json and injects:                             │
│       globalThis["__DSH_VERSION__"] = "0.1.1-rc.2"                            │
└──────────────────────────────────────────────────────────────────────────────┘
                                   │ browser loads the page
                                   ▼
┌─────────────────────────────── browser (client) ────────────────────────────┐
│                                                                              │
│  dsh-sm-version-display/client/client.js (client half)                        │
│    ├─ registers a sidebar.footer.action list-slot entry (order: 100)          │
│    ├─ turns the [data-slot="sidebar.footer.action"] outlet into a block       │
│    │   layout → its own full row                                              │
│    ├─ the VersionCard component reads window.__DSH_VERSION__ and shows it     │
│    └─ fetches https://registry.npmjs.org/@deepseek-ai/dsh/latest              │
│        on load + every 30 min + on window focus, then compares               │
└──────────────────────────────────────────────────────────────────────────────┘
```

| File | Responsibility |
|---|---|
| `lib/index.js` | Host half: injects `__DSH_VERSION__` (read at runtime, follows upgrades automatically) |
| `client/client.js` | Client half: version card component + update detection + slot registration + styles |
| `cordis.patch.yml` | Bundle patch: inserts the plugin into the profile's layer stack |
| `scripts/validate.mjs` | Build validation: syntax checks + version-comparison self-tests + package integrity |

## Development & Build

This plugin is a **hand-written bundle** (same format as official dsh client plugins: `window.__ModuleLoader__.load({ id, factory })`) — no compilation step is needed:

```bash
npm run check      # syntax check (lib + client)
npm run build      # full build validation (syntax + comparator self-tests + integrity)
node scripts/validate.mjs
```

Directory structure:

```text
dsh-sm-version-display-2026.08.23/
├── package.json          # package manifest (dsh.client / dsh.bundle.patch / v1.0.0)
├── cordis.patch.yml      # bundle patch
├── lib/
│   └── index.js          # host half
├── client/
│   └── client.js         # client half (ModuleLoader bundle)
├── scripts/
│   └── validate.mjs      # build validation script
├── README.md             # Chinese docs
├── README.en.md          # English docs
├── LICENSE               # MIT
└── .gitignore
```

## Upgrade Compatibility

- **dsh upgrades**: the version is read at render time by the host half, so after an upgrade and restart the card shows the new version automatically;
- **Plugin persistence**: the plugin lives in `~/.dsh/profiles/web/` (user data directory) and is not removed by dsh upgrades;
- **Interface dependencies**: uses only official dsh extension points — the `dsh.client` declaration, the `sidebar.footer.action` slot, the `webserver/index-inject` event, and `ctx.slots.inject/register`; the risk profile matches ecosystem plugins such as dshmarket — a breaking API change only needs a small adaptation.

## License

[MIT](./LICENSE) © 2026 hjj345
