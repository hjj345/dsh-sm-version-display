# DSH 版本检测 | dsh-sm-version-display

中文文档 · [English documentation](README.en.md)

[![version](https://img.shields.io/badge/version-v1.2.16-blue?style=flat-square)](https://www.npmjs.com/package/%40hjj345345%2Fdsh-sm-version-display) [![DSH](https://img.shields.io/badge/DSH-%3E%3D%20v0.1.7--rc.1-orange?style=flat-square)](#兼容性) [![node](https://img.shields.io/badge/node-%3E%3D20-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/) [![license](https://img.shields.io/badge/license-MIT-brightgreen?style=flat-square)](LICENSE) [![platform](https://img.shields.io/badge/platform-Web-lightgrey?style=flat-square)](#兼容性)

GitHub：[hjj345/dsh-sm-version-display](https://github.com/hjj345/dsh-sm-version-display)<br>
npm：[@hjj345345/dsh-sm-version-display](https://www.npmjs.com/package/%40hjj345345%2Fdsh-sm-version-display)

<p align="center">
  <img src="images/sm-version-display-icon-outlined.png" alt="DSH 版本检测插件图标" width="180">
</p>

> 最低支持 DSH 版本：`v0.1.7-rc.1`（含）。当前插件版本：`v1.2.16`。

## 简介

`@hjj345345/dsh-sm-version-display` 是一个面向 DeepSeek Harness（DSH）Web 界面的客户端 + host 双半区插件。它在侧边栏「设置」按钮上方显示当前已安装的 DSH 版本，并检测 npm registry 与官方 GitHub Release 的新版本。

从 `v1.1.0` 开始，插件同时在 DSH 设置中新增“DSH版本检测”一级页面（排序 `22`，位于参考插件下方）。页面复刻参考插件的卡片式设计，提供插件开关、通用设置、关于插件和安装命令；支持简体中文、English、繁體中文三种语言。检测结果会在 DSH 进程期间缓存，设置弹窗重新打开后仍可查看。检测到更新时，用户可以先查看风险并确认后由插件执行精确版本命令，也可以打开手动更新步骤逐条执行。

这里有三个名称需要区分：

- npm 包名：`@hjj345345/dsh-sm-version-display`
- DSH 运行时插件 ID：`dsh-sm-version-display`
- GitHub 仓库：`hjj345/dsh-sm-version-display`

插件版本 `v1.2.16` 表示本插件版本；卡片中显示的是运行时读取到的 DSH 版本，两者不是同一个版本号。

## 功能特性

- **版本卡片**：在侧边栏底部「设置」按钮上方显示圆角版本卡片，并独占一行。
- **运行时读取**：host 半区在渲染页面时读取已安装的 `@deepseek-ai/dsh` 版本，DSH 升级并重启后自动跟随。
- **安全回退**：host 版本暂时不可用时显示“版本未知”，不会猜测或伪造固定版本。
- **更新检测**：页面加载、每 30 分钟以及窗口重新回到前台时检查 npm 和 GitHub Release；结果在 DSH 进程内缓存。
- **GitHub 限流回退**：GitHub API 受限时自动改用官方 Releases Atom Feed；npm 检测不受影响。
- **版本类型**：GitHub 版本区分预发布 Alpha、测试版 Beta、公测版 RC 和正式版 Release。
- **语义化比较**：内置轻量版本比较逻辑，支持 Alpha、Beta、RC、正式版和多位数字版本号比较。
- **手动刷新**：卡片内提供刷新按钮，检查期间显示加载状态，完成后显示 DSH 原生 Toast。
- **DSH 设置页**：在 DSH 设置中注册“DSH版本检测”，位于参考插件 `sm-context-piano`（排序 `21`）下方，使用默认齿轮图标（排序 `22`）。
- **设置卡片**：包含插件名称、副标题、开关、通用设置、关于插件和安装命令，整体复刻参考插件的设计。
- **三语设置**：支持简体中文、English、繁體中文，默认简体中文，并持久化语言选择。
- **展开式检测**：在设置页按钮下方并排显示 npm 与 GitHub 版本、类型、发布时间、Release 链接、当前安装方式和插件管理方式。
- **双路径更新**：更新前必须确认风险；支持 host 后台自动执行，或打开完整命令和步骤手动更新。
- **更新输出**：自动更新时显示执行命令、实时输出、成功/失败状态和重启要求。
- **备份选择**：更新确认时默认备份，也可明确跳过；跳过后本次更新不提供备份回滚。可选择 DSH 所在电脑上的保存目录，并记住上次位置。
- **备份管理**：统一查看默认及已登记自定义目录中的完整、失败和中断备份，显示实际文件大小合计，支持刷新、扫描指定目录及确认后批量删除；不会跟随备份内链接删除外部文件。
- **失败恢复**：备份失败后显示停止时间、原因和已复制大小，可重新备份并重试；只有完整且校验通过的对应备份才能回滚。
- **安全一键更新**：仅执行 host 内固定的精确版本命令；请求仅限本机回环地址，GitHub 源码版本无对应 npm 包时仅提供手动构建步骤。
- **响应式布局**：侧边栏折叠为窄栏时显示圆形版本图标，文本空间不足时自动换行。
- **主题适配**：使用 DSH 设计系统变量，跟随浅色和深色主题。
- **悬停提示**：卡片和窄栏图标会显示插件英文名 `dsh-sm-version-display` 及当前版本。

## 实际效果截图 / Screenshots

备份目录选择器浏览的是 **DSH 服务所在电脑**，不是远程浏览器所在设备。备份列表不扫描整台电脑；此前默认目录中的不完整备份也会列出，自定义目录可通过指定目录扫描补充。大小为备份普通文件的逻辑大小合计，不包含链接目标，也不等同于文件系统实际分配空间。删除备份不可撤销；删除当前任务对应的完整备份后，该任务将无法回滚。正在使用的备份不允许删除。

侧边栏版本卡片：

<p align="center">
  <img src="images/Screenshot/0RudPrDwe6.png" alt="侧边栏版本卡片" width="420">
</p>

侧边栏窄栏悬停提示：

<p align="center">
  <img src="images/Screenshot/chrome_OQz4xZKVFZ.png" alt="侧边栏窄栏悬停提示" width="420">
</p>

设置页总览：

<p align="center">
  <img src="images/Screenshot/chrome_nhY8tQiILP.png" alt="DSH版本检测设置页总览" width="680">
</p>

双源版本检测结果：

<p align="center">
  <img src="images/Screenshot/chrome_kpQwbwJoWO.png" alt="npm与GitHub双源版本检测结果" width="680">
</p>

更新确认弹窗：

<p align="center">
  <img src="images/Screenshot/chrome_ThdSMjsumh.png" alt="DSH更新确认弹窗" width="680">
</p>

更新执行记录、关于插件与安装命令：

<p align="center">
  <img src="images/Screenshot/chrome_9tWPgqs9Pp.png" alt="更新执行记录关于插件与安装命令" width="680">
</p>

示例状态：

```text
vX.Y.Z（最新版）
vX.Y.Z（有更新：vA.B.C）
```

## 安装与卸载

### 从 npm 安装（推荐）

在安装了 DSH 的机器上执行：

```powershell
dsh plugin --profile web add @hjj345345/dsh-sm-version-display
```

安装完成后重启 DSH Web 服务或重新打开 Web 界面：

```powershell
dsh web
```

卸载：

```powershell
dsh plugin --profile web remove @hjj345345/dsh-sm-version-display
```

### 本地开发链接

本地开发时可以使用 `link:` 指向插件目录。下面的路径只是示例，请替换为实际路径，不要把个人电脑路径写入 README、源码或 npm 包：

```powershell
dsh plugin --profile web add link:C:/path/to/dsh-sm-version-display
```

本地链接仅用于开发调试；正式使用应切换回 npm 包安装。

## 设置页与版本更新

打开 DSH 设置并选择 **DSH版本检测**。点击“检测DSH版本”后，npm 与 GitHub 结果会在按钮下方展开显示，并在本次 DSH 进程期间保留。只有用户点击“收起检测结果”后才会折叠；重新启动 DSH 后状态重置。

更新命令始终区分 npm 和 npx；如果本机是 pnpm 全局安装，还会优先显示 pnpm 命令：

```powershell
# npm 全局安装
npm install --global @deepseek-ai/dsh@<version>

# npx 临时执行指定版本
npx --yes @deepseek-ai/dsh@<version> web

# pnpm 全局安装
pnpm add --global @deepseek-ai/dsh@<version>
```

npx 没有需要替换的全局安装；GitHub Release 如果没有对应 npm 包，则需要按照弹窗中的 clone、checkout、pnpm install、build 和启动步骤手动执行。任何更新完成后都需要重启 DSH Web 服务。

自动更新会先显示来源、目标版本、版本类型和风险，用户确认后先备份并预检。如果检测到全局安装或 profile 中有旧版本固定依赖，页面会给出停机后的精确修复命令；命令完成后仍须重启 DSH，并在插件页面执行验证，才会标记更新成功。Alpha、Beta、RC 版本可能包含破坏性变更；切换版本前建议备份 `.dsh` 配置和 profile 数据。回退时请使用明确的旧版本号，例如 `@deepseek-ai/dsh@0.1.1-rc.2`。

## 工作原理

```text
DSH host process
  lib/index.js
    └─ 监听 webserver/index-inject
       读取已安装 @deepseek-ai/dsh/package.json 的 version
       注入 globalThis["__DSH_VERSION__"]、__DSH_INSTALL_INFO__ 和页面级更新 token
              │
              ▼
DSH Web browser
  client/client.js
    ├─ 注册 sidebar.footer.action 版本卡片和 settings.section 设置页
     ├─ 读取 window.__DSH_VERSION__ 并渲染版本卡片
     ├─ GET 本机检查路由（host 缓存 npm 与 GitHub Release）
     └─ POST 本机更新路由（仅固定精确版本命令）
        比较当前版本和两个来源的版本
```

发布包中的关键文件：

| 文件 | 作用 |
| --- | --- |
| `lib/index.js` | host 半区；注入当前 DSH 版本 |
| `client/client.js` | client 半区；卡片、更新检测、Toast 和样式 |
| `cordis.patch.yml` | 将插件挂载到 DSH profile 层 |
| `LICENSE` | MIT 开源许可证 |

## 隐私与网络说明

- host 半区只读取本机已安装的 DSH 包清单中的版本字段和安装路径类型，不向浏览器暴露绝对路径。
- host 半区查询 npm Registry 与 GitHub Releases，并在 DSH 进程内缓存结果；GitHub API 限流时回退到官方 Releases Atom Feed；更新请求携带 host 注入的页面级 token。
- 更新路由只接受本机回环请求和匹配 token，命令和参数在 host 内固定，不接受浏览器传入任意命令。
- 请求不携带 DSH 登录凭据、会话内容或用户文件，插件也不会读取聊天内容。
- npm registry 请求失败时保留当前版本显示，并在手动检查时显示通用错误提示。
- 仓库和 npm 包均排除 `.env`、`.npmrc`、令牌、密钥、证书、日志、依赖目录及本地 DSH 数据。

## 兼容性

| 项目 | 要求 |
| --- | --- |
| DSH | `>= v0.1.7-rc.1` |
| Node.js | `>= 20`（host 运行环境） |
| 平台 | DSH Web |
| 插件版本 | `v1.2.16` |

插件使用 DSH 官方扩展点：`dsh.client`、`sidebar.footer.action`、`settings.section`、`webserver/index-inject` 和 `ctx.slots.inject/register`。启用状态与语言保存在 DSH profile 配置中；升级时会把仍留在浏览器本地的旧设置迁移到 profile，已有 profile 设置优先保留。

插件市场从 npm 包的顶层 `engines.dsh` 读取最低宿主版本；本插件声明为 `>=0.1.7-rc.1`，与上表一致。

## 开发与本地验证

本插件使用与 DSH 客户端插件一致的手写 bundle 格式：`window.__ModuleLoader__.load({ id, factory })`，不需要额外编译器或运行时依赖。

在项目根目录执行：

```powershell
npm run check
npm run build
```

`npm run build` 会执行 host/client 语法检查、版本比较自测、设置页/更新链路契约检查、包完整性检查和 README 检查。

## 更新日志

### v1.2.16 - 2026-09-26

- 修复 DSH 0.1.7 设置接口兼容：设置页由 host 注册配置模式，客户端改用 DSH Remote Settings API 读取和更新 profile 配置。
- 新增旧设置迁移：将浏览器本地保存的启用状态与语言迁移到 DSH profile；仅补齐 profile 中尚不存在的字段，保留已有 profile 设置，迁移成功后再清理旧浏览器数据。
- 将 npm 包声明的最低 DSH 版本更新为 `>=0.1.7-rc.1`，并同步双语文档的适配说明。
- 补充设置迁移自测，并更新 UI、路由和发布契约测试，覆盖 profile 写入、旧数据迁移及新设置接口。
- 修复 DSH 0.1.7 设置字段未标记为可编辑、重启验证后的更新看板残留，并同步开发接口到 schemastery 3.18.4。
- 修正 Remote Settings 返回值解包、显式注入 `remote.settings`，并监听外部设置变更。

### v1.2.13 - 2026-09-25

- 完善一键更新停机恢复：识别需要关闭 DSH 才能完成的依赖安装/修复，将操作步骤和命令展示给用户，并在重启后重新验证目标版本及 Web profile。
- 改进升级状态恢复与成功判定：设置页重新打开后可恢复并继续跟踪进行中的任务；只有安装及 profile 验证通过后才确认成功，重启待验证任务提供重新验证入口。
- 明确插件市场兼容性：在 npm 包元数据中声明最低 DSH 版本 `>=0.1.7-rc.1`，并在双语兼容性说明中解释该要求。
- 补充停机更新、重启验证及依赖修复相关三语文案和 Worker、路由、界面契约测试。
- 更新插件包、客户端关于页面、发布契约和双语文档的版本标识为 `v1.2.13`，发布日期为 `2026-09-25`。

### v1.2.12 - 2026-09-24

- 新增 npm Trusted Publishing 工作流：支持推送 `v*` 标签或从 `master` 手动触发发布；发布前校验标签/输入版本与 `package.json` 一致，并自动执行构建、测试和 npm 发布。
- 修复备份目录路径校验在不同平台上的兼容问题，并补齐对应测试；Trusted Publishing 流程也安装路由测试所需的 host peer 依赖，确保 CI 测试可运行。
- 修复自动备份删除期间的超时与列表竞态：删除操作未完成时延后定时刷新，避免旧请求恢复已删除记录；删除完成后更新列表并正确显示结果。
- 更新插件包、客户端关于页面、发布契约和双语文档的版本标识为 `v1.2.12`，发布日期为 `2026-09-24`。

### v1.2.11 - 2026-09-24

- 完善 DSH 一键升级备份管理：支持默认备份、明确跳过备份、指定 DSH 主机目录，并记住最近使用的备份目录；目录浏览限定在 DSH 主机，不扫描远程浏览器设备，也不跟随符号链接。
- 新增并优化备份管理卡片：展示默认或自定义目录中的完整、失败和中断备份，显示文件数量与逻辑大小，支持刷新、目录扫描及确认后删除；正在使用、不完整或路径已变化的备份会受到保护。
- 增强失败恢复：展示备份失败原因、停止时间和已复制大小，支持重试备份；只有完整、校验通过且与当前升级任务匹配的备份才允许回滚，并保留回滚恢复副本。
- 优化升级看板、备份目录选择器和三语文案，补充备份管理器、路由、界面及发布契约自测，覆盖目录安全校验、manifest、进度、删除保护和恢复链路。
- 更新插件包、客户端关于页面和双语文档的版本标识为 `v1.2.11`，发布日期为 `2026-09-24`。

### v1.2.10 - 2026-09-15

- 修复升级状态文件并发写入失败：host 与升级 Worker 使用带进程号和随机标识的独立临时文件，避免多个进程共享 `.tmp` 文件互相覆盖。
- 增强 Windows 原子替换可靠性：状态文件重命名遇到 `EPERM`、`EACCES` 或 `EBUSY` 时按有限次数重试，并在成功或失败后清理临时文件。
- 消除 Worker 启动后的重复状态写入，避免 host 在记录 Worker PID 时覆盖 Worker 已写入的最新升级状态。
- 补充发布契约校验：覆盖 host/Worker 的状态写入重试常量、`SharedArrayBuffer` 等待机制，并禁止旧共享临时文件名回归。
- 更新插件包、客户端关于页面和双语文档的版本标识为 `v1.2.10`，发布日期为 `2026-09-15`。

### v1.2.9 - 2026-09-15

- 优化 DSH 升级备份进度与心跳看板：实时展示备份扫描/复制进度、当前步骤、目标版本、命令及已处理文件数量，升级过程更容易定位和跟踪。
- 增强 Worker 心跳机制：记录最近活动时间，超过 10 分钟没有进度时标记为心跳超时，并提供继续等待、自动修复或一键回滚选项，避免误判长时间任务状态。
- 完善升级修复流程：增加 Web profile 修复步骤，处理 profile、配置导出、端口占用和 DSH 仍在运行等常见失败场景，并提供手动修复命令与提示。
- 强化更新动作交互：新增更新执行看板、目标版本和无命令输出状态，失败操作按钮支持等待、自动修复和回滚，并在动作切换期间正确停止或恢复 Worker。
- 扩展三语文案与发布契约校验，覆盖心跳超时、进度看板、profile 修复、更新动作和升级 Worker 相关内容。
- 更新插件包、客户端关于页面和双语文档的版本标识为 `v1.2.9`，发布日期为 `2026-09-15`。

### v1.2.8 - 2026-09-14

- 完善 DSH 一键升级安全流程：新增独立升级 Worker，按备份、目标版本预检、全局依赖树修复、安装目标版本和安装结果/profile 校验分步执行，避免长时间升级任务阻塞主进程。
- 增加可恢复环境备份：升级前备份全局 DSH 目录与 DSH profile 数据，生成包含版本、路径、文件数和字节数的 manifest，并限制目录遍历不跟随符号链接。
- 增强失败处理：升级 Worker 持久化步骤、输出、警告和状态；任务异常中断会标记为失败，备份完成后提供自动修复与一键回滚，回滚后再次校验恢复的 DSH 版本并保留恢复副本。
- 增强客户端更新交互：显示备份路径、备份文件数、步骤状态和 peer dependency 警告；失败时支持自动修复或一键回滚，并轮询新的更新动作任务状态。
- 将 `lib/update-worker.mjs` 纳入 npm 发布白名单，并补充 Worker 自测、虚拟存储目录解析、客户端更新动作和发布文件契约校验。
- 更新插件包、客户端关于页面和双语文档的版本标识为 `v1.2.8`，发布日期为 `2026-09-14`。

### v1.2.7 - 2026-09-07

- 移除全局 pnpm 不支持的 `--virtual-store-dir` 参数。
- 当检测到旧版全局虚拟存储布局时，先串行执行 `pnpm install --global --force` 重建全局依赖树，再执行普通 DSH 更新命令。

### v1.2.6 - 2026-09-07

- 修复 PNPM `.modules.yaml` 为单行 JSON 时无法读取 `virtualStoreDir` 的问题，确保一键更新会沿用现有全局虚拟存储目录。
- 增加 JSON 格式和旧版行式格式的解析自测，避免更新命令再次回退为未带目录参数的旧命令。

### v1.2.5 - 2026-09-07

- 修复 PNPM 全局更新的虚拟存储目录兼容性：从已解析的 DSH 包路径向上查找 `.modules.yaml`，读取并校验 `virtualStoreDir`，在可用时将其传入更新命令，避免 PNPM 依赖树位置不一致导致更新失败。
- 增强命令路径处理：兼容 `.modules.yaml` 中的引号格式、Windows 绝对路径和最多 10 层父目录查找；对包含空格、`&` 或引号的参数进行安全转义，保证 Windows `cmd.exe` 执行文本正确。
- 补充发布契约校验：覆盖虚拟存储目录解析、`--virtual-store-dir` 参数和现有客户端注入契约，防止 PNPM 更新兼容修复回退。
- 更新插件包、客户端关于页面和双语文档的版本标识为 `v1.2.5`，发布日期为 `2026-09-07`。

### v1.2.4 - 2026-09-03

- 修复 DSH 新旧客户端模块加载兼容性：将 `dsh.client.inject` 中的过时 `@deepseek-ai/dsh-client-runtime` 替换为 `@deepseek-ai/dsh-client-modules`，保留语言、设置页、插槽和 UI 原语模块注入。
- 强化发布契约校验：明确要求 `@deepseek-ai/dsh-client-modules` 存在，并禁止已过时的 `@deepseek-ai/dsh-client-runtime` 残留，避免客户端加载入口回退。
- 更新插件包、客户端关于页面和双语文档的版本标识为 `v1.2.4`，发布日期为 `2026-09-03`。

### v1.2.3 - 2026-09-03

- 补充双语 README 的实际效果截图，覆盖侧边栏版本卡片、侧边栏窄栏悬停提示、设置页总览、npm/GitHub 双源版本检测结果、更新确认弹窗，以及更新执行记录、关于插件和安装命令。
- 将 `images/Screenshot/` 纳入 npm 发布白名单，确保发布包包含 README 所引用的 6 张截图资源。
- 同步发布契约校验：纳入截图目录的发布文件清单，更新当前插件版本与发布日期校验，避免文档、包元数据和实际发布内容不一致。
- 更新插件包、客户端关于页面和双语文档的版本标识为 `v1.2.3`，发布日期为 `2026-09-03`。

### v1.2.2 - 2026-09-02

- 修复新版 DSH 设置服务兼容性：移除对 `settingsNamespace` 辅助函数的直接导入，改用设置命名空间字符串注册插件设置，兼容新增的 `@deepseek-ai/dsh-settings` 版本。
- 扩展 peerDependencies 版本范围：支持 `@deepseek-ai/dsh-settings` 的 `0.1.2-alpha.2`、`0.1.2-alpha.4`，以及 `@deepseek-ai/schemastery` 的 `3.18.2`，同时保留既有兼容版本。
- 更新发布契约校验：验证新的字符串命名空间注册方式，确保 DSH 设置兼容修复不会在后续改动中回退。
- 同步插件包、客户端关于页面和双语文档的版本标识为 `v1.2.2`，发布日期为 `2026-09-02`。

### v1.2.1 - 2026-09-02

- 修复 GitHub 版本检测的限流容错：GitHub API 请求失败时自动尝试 Releases Atom Feed，并统一 API 与 Feed 返回的版本、类型、标签、发布日期、Release 链接和 npm 可用性信息。
- 增强 GitHub 检测状态展示：能够区分 API、备用 Feed、限流和暂时不可用状态；侧边栏版本卡片、Tooltip、检测结果卡片和更新提示会同步显示 npm/GitHub 来源与状态。
- 优化 Release 链接：无论数据来自 GitHub API 还是 Atom Feed，均规范为官方 Release 页面，并提供多语言“一键直达/Click to open”入口。
- 完善三语文案：补齐简体中文、英文和繁体中文的稳定渠道 `latest`、更新来源、检测通道、Feed 状态、限流提示和 Release 直达文案；语言下拉项统一保持 `语言/Language`。
- 补充发布契约校验：覆盖 GitHub Feed 回退、限流错误、检测通道、Feed 文案、Release 直达文案及三语多语言键，确保新链路不会被后续改动破坏。
- 更新插件包、客户端关于页面和双语文档的版本标识为 `v1.2.1`，发布日期为 `2026-09-02`。

### v1.2.0 - 2026-09-01

- 重构双源版本检测：同时查询 npm Registry 与官方 GitHub Releases，显示当前版本、最新版本、发布类型、发布日期、Release 标签、链接及 npm 可用性。
- 增强版本识别与比较：支持 Alpha、Beta、RC、正式版及多位数字版本，并区分最新、可更新、当前版本更高和检测失败等状态。
- 完善检测时机与缓存：页面加载时检测，每 30 分钟自动刷新，窗口回到前台时按间隔刷新；结果由 DSH 进程缓存，避免重复请求。
- 更新设置页结果展示：新增可展开的 npm/GitHub 双卡片，展示当前安装方式和插件管理器，并提供稳定渠道 `latest` 的清晰中文、英文和繁体中文文案。
- 增加安全更新流程：更新前明确展示来源、目标版本、发布类型和风险，只有经过确认的固定版本命令才会执行。
- 增强主机端更新保护：更新接口限制为回环地址、合法来源和页面级令牌，校验目标是否过期，避免重复任务，并记录命令输出、完成状态、失败原因和重启提示。
- 覆盖多种更新方式：npm 与 pnpm 支持主机端一键更新，npx 提供临时执行命令；没有对应 npm 包的 GitHub 版本自动回退到 clone、checkout、安装、构建和启动步骤。
- 同步插件包、关于页面及双语文档的版本标识为 `v1.2.0`，发布日期为 `2026-09-01`，并补充对应的构建与多语言契约校验。

### v1.1.1 - 2026-08-29

- 新增黑白描边版插件 Logo，并应用到双语 README 和设置页顶部。
- 设置页图标沿用参考项目的桌面端 54px 展示尺寸，使用内联 PNG 保证 npm 安装后可用。

### v1.1.0 - 2026-08-29

- 新增 DSH 设置中的“DSH版本检测”一级导航，使用默认齿轮图标。
- 新增复刻参考项目的插件设置卡片和三语语言设置。
- 新增展开式版本检测结果、npm/npx/pnpm 更新区分和安全一键更新路由。
- 统一所有用户可见插件版本为 `v1.1.0`。

### v1.0.1 - 2026-08-29

- 修复 scoped npm 包的 DSH bundle 导入名，保持运行时插件 ID 不变。

### v1.0.0 - 2026-08-28

- 首次发布 DSH Web 版本显示插件。
- 支持运行时读取 DSH 版本、npm registry 更新检查、手动刷新和 Toast 提示。
- 支持侧边栏响应式布局、浅色/深色主题以及中英文界面。
- 增加版本比较、超时控制和版本不可用时的安全回退。

## 作者

作者：Jack·Huang<br>
邮箱：[jack698698@gmail.com](mailto:jack698698@gmail.com)

## License

本项目以 [MIT License](LICENSE) 发布。Copyright © 2026 Jack·Huang。
