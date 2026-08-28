# DSH Version Display | dsh-sm-version-display

[中文文档](README.md) · English documentation

[![version](https://img.shields.io/badge/version-v1.0.0-blue?style=flat-square)](https://www.npmjs.com/package/%40hjj345345%2Fdsh-sm-version-display) [![DSH](https://img.shields.io/badge/DSH-%3E%3D%20v0.1.0--rc.6-orange?style=flat-square)](#compatibility) [![node](https://img.shields.io/badge/node-%3E%3D20-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/) [![license](https://img.shields.io/badge/license-MIT-brightgreen?style=flat-square)](LICENSE) [![platform](https://img.shields.io/badge/platform-Web-lightgrey?style=flat-square)](#compatibility)

GitHub: [hjj345/dsh-sm-version-display](https://github.com/hjj345/dsh-sm-version-display)<br>
npm: [@hjj345345/dsh-sm-version-display](https://www.npmjs.com/package/%40hjj345345%2Fdsh-sm-version-display)

> Minimum supported DSH version: `v0.1.0-rc.6` (inclusive). Current plugin version: `v1.0.0`.

## Introduction

`@hjj345345/dsh-sm-version-display` is a client + host dual-half plugin for the DeepSeek Harness (DSH) Web interface. It displays the currently installed DSH version above the sidebar Settings button and checks npm for a newer DSH release.

The following names refer to different things:

- npm package: `@hjj345345/dsh-sm-version-display`
- DSH runtime plugin ID: `dsh-sm-version-display`
- GitHub repository: `hjj345/dsh-sm-version-display`

Plugin version `v1.0.0` identifies this plugin. The version shown in the card is the DSH version read at runtime; they are not the same version.

## Features

- **Version card**: displays a rounded version card on its own row above the sidebar Settings button.
- **Runtime detection**: the host half reads the installed `@deepseek-ai/dsh` version while rendering the page, so the card follows DSH upgrades after restart.
- **Safe fallback**: if the host version is temporarily unavailable, the card shows “Version unavailable” instead of guessing a fixed version.
- **Update checks**: checks on page load, every 30 minutes, and when the window returns to the foreground; foreground checks are throttled for 5 minutes.
- **Semantic comparison**: includes a lightweight comparator for RC, beta, stable, and multi-digit versions.
- **Manual refresh**: provides a refresh button with a loading state and a native-style DSH Toast after the check completes.
- **Responsive layout**: shows a round version icon in the collapsed sidebar rail and wraps text when space is limited.
- **Theme aware**: uses DSH design-system variables and follows light and dark themes.
- **Bilingual UI**: Simplified Chinese and English follow the DSH interface locale.
- **Hover tooltip**: the card and collapsed-rail icon show the English plugin name `dsh-sm-version-display` and the current version.

Example states:

```text
vX.Y.Z (Latest)
vX.Y.Z (Update available: vA.B.C)
```

## Installation and removal

### Install from npm (recommended)

Run this on the machine where DSH is installed:

```powershell
dsh plugin --profile web add @hjj345345/dsh-sm-version-display
```

Restart the DSH Web service or reopen the Web interface after installation:

```powershell
dsh web
```

To remove the plugin:

```powershell
dsh plugin --profile web remove @hjj345345/dsh-sm-version-display
```

### Link a local development directory

For local development, use `link:` with the plugin directory. The path below is only an example; replace it with your actual path and never commit a personal machine path to the README, source, or npm package:

```powershell
dsh plugin --profile web add link:C:/path/to/dsh-sm-version-display
```

Use local linking only for development. Switch back to the npm package for normal use.

## How it works

```text
DSH host process
  lib/index.js
    └─ listens to webserver/index-inject
       reads version from the installed @deepseek-ai/dsh/package.json
       injects globalThis["__DSH_VERSION__"]
              │
              ▼
DSH Web browser
  client/client.js
    ├─ registers the sidebar.footer.action slot
    ├─ reads window.__DSH_VERSION__ and renders the version card
    └─ GETs https://registry.npmjs.org/@deepseek-ai/dsh/latest
       compares the current and latest DSH versions
```

Key files in the published package:

| File | Purpose |
| --- | --- |
| `lib/index.js` | Host half; injects the current DSH version |
| `client/client.js` | Client half; card, update checks, Toast, and styles |
| `cordis.patch.yml` | Mounts the plugin into the DSH profile layer |
| `LICENSE` | MIT open-source license |

## Privacy and network behavior

- The host half reads only the version field from the locally installed DSH package manifest.
- The client half makes only a version request to `https://registry.npmjs.org/@deepseek-ai/dsh/latest`.
- The request does not include DSH credentials, conversation content, or user files; the plugin does not read chat content.
- If the registry request fails, the current version remains visible and a generic error is shown for manual checks.
- The repository and npm package exclude `.env`, `.npmrc`, tokens, keys, certificates, logs, dependency directories, and local DSH data.

## Compatibility

| Item | Requirement |
| --- | --- |
| DSH | `>= v0.1.0-rc.6` |
| Node.js | `>= 20` (host runtime) |
| Platform | DSH Web |
| Plugin version | `v1.0.0` |

The plugin uses official DSH extension points: `dsh.client`, `sidebar.footer.action`, `webserver/index-inject`, and `ctx.slots.inject/register`. If DSH introduces a breaking change to these extension points, the plugin will need a corresponding update.

## Development and local verification

This plugin uses the hand-written bundle format used by DSH client plugins: `window.__ModuleLoader__.load({ id, factory })`. It does not require an additional compiler or runtime dependency.

Run these commands from the project root:

```powershell
npm run check
npm run build
```

`npm run build` performs host/client syntax checks, comparator self-tests, and package-integrity checks.

## License

This project is released under the [MIT License](LICENSE). Copyright © 2026 hjj345.
