# DSH Version Checker | dsh-sm-version-display

[中文文档](README.md) · English documentation

[![version](https://img.shields.io/badge/version-v1.1.1-blue?style=flat-square)](https://www.npmjs.com/package/%40hjj345345%2Fdsh-sm-version-display) [![DSH](https://img.shields.io/badge/DSH-%3E%3D%20v0.1.0--rc.6-orange?style=flat-square)](#compatibility) [![node](https://img.shields.io/badge/node-%3E%3D20-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/) [![license](https://img.shields.io/badge/license-MIT-brightgreen?style=flat-square)](LICENSE) [![platform](https://img.shields.io/badge/platform-Web-lightgrey?style=flat-square)](#compatibility)

GitHub: [hjj345/dsh-sm-version-display](https://github.com/hjj345/dsh-sm-version-display)<br>
npm: [@hjj345345/dsh-sm-version-display](https://www.npmjs.com/package/%40hjj345345%2Fdsh-sm-version-display)

<p align="center">
  <img src="images/sm-version-display-icon-outlined.png" alt="DSH Version Checker plugin icon" width="180">
</p>

> Minimum supported DSH version: `v0.1.0-rc.6` (inclusive). Current plugin version: `v1.1.1`.

## Introduction

`@hjj345345/dsh-sm-version-display` is a client + host dual-half plugin for the DeepSeek Harness (DSH) Web interface. It displays the currently installed DSH version above the sidebar Settings button and checks npm for a newer DSH release.

Since `v1.1.0`, the plugin also adds a first-level **DSH Version Checker** page in DSH Settings (`order: 22`, directly below the reference plugin). The page follows the reference plugin’s card-based design and includes the plugin switch, General settings, About, and Install Command sections. It supports Simplified Chinese, English, and Traditional Chinese. Clicking **Check DSH version** expands the installed version, latest npm version, detected DSH installation method, and plugin manager; update commands are clearly separated for npm, npx, and pnpm, with safe host-side one-click updates available for npm/pnpm global installations.

The following names refer to different things:

- npm package: `@hjj345345/dsh-sm-version-display`
- DSH runtime plugin ID: `dsh-sm-version-display`
- GitHub repository: `hjj345/dsh-sm-version-display`

Plugin version `v1.1.1` identifies this plugin. The version shown in the card is the DSH version read at runtime; they are not the same version.

## Features

- **Version card**: displays a rounded version card on its own row above the sidebar Settings button.
- **Runtime detection**: the host half reads the installed `@deepseek-ai/dsh` version while rendering the page, so the card follows DSH upgrades after restart.
- **Safe fallback**: if the host version is temporarily unavailable, the card shows “Version unavailable” instead of guessing a fixed version.
- **Update checks**: checks on page load, every 30 minutes, and when the window returns to the foreground; foreground checks are throttled for 5 minutes.
- **Semantic comparison**: includes a lightweight comparator for RC, beta, stable, and multi-digit versions.
- **Manual refresh**: provides a refresh button with a loading state and a native-style DSH Toast after the check completes.
- **DSH settings page**: registers “DSH Version Checker” below the reference plugin `sm-context-piano` (`order: 21`), at `order: 22`, using DSH’s default gear icon.
- **Reference-style cards**: includes the plugin hero, enable switch, General settings, About, and Install Command cards.
- **Three language choices**: Simplified Chinese, English, and Traditional Chinese, with Simplified Chinese as the default and persisted in DSH Settings.
- **Expandable check results**: shows the installed DSH version, latest npm version, current installation method, and plugin manager beneath the check button.
- **Update guidance**: offers a safe one-click update where possible and a complete command dialog that distinguishes npm, npx, and the detected pnpm method.
- **Loopback-only update**: npm/pnpm global installs use a fixed host-side command; updating finishes with a restart reminder.
- **Responsive layout**: shows a round version icon in the collapsed sidebar rail and wraps text when space is limited.
- **Theme aware**: uses DSH design-system variables and follows light and dark themes.
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

## Settings page and DSH updates

Open DSH Settings and select **DSH Version Checker**. Click **Check DSH version** to expand the result directly below the button. No result popup is used. When a newer version is found, choose **Update now** or open **Update commands** for the complete instructions.

The command dialog always distinguishes npm and npx. If the host detects a pnpm global installation, it is shown first:

```powershell
# npm global install
npm install --global @deepseek-ai/dsh@latest

# npx temporary execution
npx --yes @deepseek-ai/dsh@latest web

# pnpm global install
pnpm add --global @deepseek-ai/dsh@latest
```

npx has no global installation to replace; the next launch with the latest npx command uses the updated package. Restart the DSH Web service after any global update.

## How it works

```text
DSH host process
  lib/index.js
    └─ listens to webserver/index-inject
       reads version from the installed @deepseek-ai/dsh/package.json
       injects globalThis["__DSH_VERSION__"], __DSH_INSTALL_INFO__, and a page token
              │
              ▼
DSH Web browser
  client/client.js
    ├─ registers the sidebar.footer.action card and settings.section page
    ├─ reads window.__DSH_VERSION__ and renders the version card
    ├─ GETs https://registry.npmjs.org/@deepseek-ai/dsh/latest
    └─ POSTs to the loopback-only update route with fixed npm/pnpm arguments
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

- The host half reads only the version field and installation-path type from the locally installed DSH package manifest; absolute paths are not sent to the browser.
- The client half makes only a version request to `https://registry.npmjs.org/@deepseek-ai/dsh/latest`; update requests carry the page-level token injected by the host.
- The update route accepts only loopback requests with the matching token and does not accept arbitrary commands or arguments from the browser.
- The request does not include DSH credentials, conversation content, or user files; the plugin does not read chat content.
- If the registry request fails, the current version remains visible and a generic error is shown for manual checks.
- The repository and npm package exclude `.env`, `.npmrc`, tokens, keys, certificates, logs, dependency directories, and local DSH data.

## Compatibility

| Item | Requirement |
| --- | --- |
| DSH | `>= v0.1.0-rc.6` |
| Node.js | `>= 20` (host runtime) |
| Platform | DSH Web |
| Plugin version | `v1.1.1` |

The plugin uses official DSH extension points: `dsh.client`, `sidebar.footer.action`, `settings.section`, `webserver/index-inject`, `ctx.slots.inject/register`, and `ctx.settingsScope`. If DSH introduces a breaking change to these extension points, the plugin will need a corresponding update.

## Development and local verification

This plugin uses the hand-written bundle format used by DSH client plugins: `window.__ModuleLoader__.load({ id, factory })`. It does not require an additional compiler or runtime dependency.

Run these commands from the project root:

```powershell
npm run check
npm run build
```

`npm run build` performs host/client syntax checks, comparator self-tests, settings/update contract checks, package-integrity checks, and README checks.

## Changelog

### v1.1.1 - 2026-08-29

- Added the black-and-white outlined plugin logo to both READMEs and the top of the settings page.
- Kept the reference project's 54px desktop settings-page presentation and embedded the PNG so npm installations remain self-contained.

### v1.1.0 - 2026-08-29

- Added the DSH Version Checker settings section below the reference plugin, with the default gear icon.
- Added the reference-style plugin settings cards and three-language setting.
- Added expandable version results, npm/npx/pnpm distinction, and a loopback-only one-click update route.
- Unified all user-visible plugin version labels to `v1.1.0`.

### v1.0.1

- Fixed the DSH bundle import name for the scoped npm package while preserving the runtime plugin ID.

### v1.0.0

- Initial release of the DSH Web version display plugin.
- Added runtime DSH version detection, npm registry update checks, manual refresh, and Toast feedback.
- Added responsive sidebar layout, light/dark theme support, and bilingual UI.
- Added semantic version comparison, request timeout handling, and a safe fallback when the version is unavailable.

## Author

Author: Jack·Huang<br>
Email: [jack698698@gmail.com](mailto:jack698698@gmail.com)

## License

This project is released under the [MIT License](LICENSE). Copyright © 2026 Jack·Huang.
