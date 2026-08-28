# DSH 版本显示 | dsh-sm-version-display

中文文档 · [English documentation](README.en.md)

[![version](https://img.shields.io/badge/version-v1.0.1-blue?style=flat-square)](https://www.npmjs.com/package/%40hjj345345%2Fdsh-sm-version-display) [![DSH](https://img.shields.io/badge/DSH-%3E%3D%20v0.1.0--rc.6-orange?style=flat-square)](#兼容性) [![node](https://img.shields.io/badge/node-%3E%3D20-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/) [![license](https://img.shields.io/badge/license-MIT-brightgreen?style=flat-square)](LICENSE) [![platform](https://img.shields.io/badge/platform-Web-lightgrey?style=flat-square)](#兼容性)

GitHub：[hjj345/dsh-sm-version-display](https://github.com/hjj345/dsh-sm-version-display)<br>
npm：[@hjj345345/dsh-sm-version-display](https://www.npmjs.com/package/%40hjj345345%2Fdsh-sm-version-display)

> 最低支持 DSH 版本：`v0.1.0-rc.6`（含）。当前插件版本：`v1.0.1`。

## 简介

`@hjj345345/dsh-sm-version-display` 是一个面向 DeepSeek Harness（DSH）Web 界面的客户端 + host 双半区插件。它在侧边栏「设置」按钮上方显示当前已安装的 DSH 版本，并从 npm registry 检查是否有新版本。

这里有三个名称需要区分：

- npm 包名：`@hjj345345/dsh-sm-version-display`
- DSH 运行时插件 ID：`dsh-sm-version-display`
- GitHub 仓库：`hjj345/dsh-sm-version-display`

插件版本 `v1.0.1` 表示本插件版本；卡片中显示的是运行时读取到的 DSH 版本，两者不是同一个版本号。

## 功能特性

- **版本卡片**：在侧边栏底部「设置」按钮上方显示圆角版本卡片，并独占一行。
- **运行时读取**：host 半区在渲染页面时读取已安装的 `@deepseek-ai/dsh` 版本，DSH 升级并重启后自动跟随。
- **安全回退**：host 版本暂时不可用时显示“版本未知”，不会猜测或伪造固定版本。
- **更新检测**：页面加载、每 30 分钟以及窗口重新回到前台时检查 DSH 最新版本；前台检查带 5 分钟节流。
- **语义化比较**：内置轻量版本比较逻辑，支持 RC、beta、正式版和多位数字版本号比较。
- **手动刷新**：卡片内提供刷新按钮，检查期间显示加载状态，完成后显示 DSH 原生 Toast。
- **响应式布局**：侧边栏折叠为窄栏时显示圆形版本图标，文本空间不足时自动换行。
- **主题适配**：使用 DSH 设计系统变量，跟随浅色和深色主题。
- **双语支持**：简体中文和 English 跟随 DSH 界面语言切换。
- **悬停提示**：卡片和窄栏图标会显示插件英文名 `dsh-sm-version-display` 及当前版本。

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

## 工作原理

```text
DSH host process
  lib/index.js
    └─ 监听 webserver/index-inject
       读取已安装 @deepseek-ai/dsh/package.json 的 version
       注入 globalThis["__DSH_VERSION__"]
              │
              ▼
DSH Web browser
  client/client.js
    ├─ 注册 sidebar.footer.action 槽位
    ├─ 读取 window.__DSH_VERSION__ 并渲染版本卡片
    └─ GET https://registry.npmjs.org/@deepseek-ai/dsh/latest
       比较当前版本和 npm 最新版本
```

发布包中的关键文件：

| 文件 | 作用 |
| --- | --- |
| `lib/index.js` | host 半区；注入当前 DSH 版本 |
| `client/client.js` | client 半区；卡片、更新检测、Toast 和样式 |
| `cordis.patch.yml` | 将插件挂载到 DSH profile 层 |
| `LICENSE` | MIT 开源许可证 |

## 隐私与网络说明

- host 半区只读取本机已安装的 DSH 包清单中的版本字段。
- client 半区只向 `https://registry.npmjs.org/@deepseek-ai/dsh/latest` 发起版本查询。
- 请求不携带 DSH 登录凭据、会话内容或用户文件，插件也不会读取聊天内容。
- npm registry 请求失败时保留当前版本显示，并在手动检查时显示通用错误提示。
- 仓库和 npm 包均排除 `.env`、`.npmrc`、令牌、密钥、证书、日志、依赖目录及本地 DSH 数据。

## 兼容性

| 项目 | 要求 |
| --- | --- |
| DSH | `>= v0.1.0-rc.6` |
| Node.js | `>= 20`（host 运行环境） |
| 平台 | DSH Web |
| 插件版本 | `v1.0.1` |

插件使用 DSH 官方扩展点：`dsh.client`、`sidebar.footer.action`、`webserver/index-inject` 以及 `ctx.slots.inject/register`。如果 DSH 后续发生不兼容的扩展点变更，需要相应适配。

## 开发与本地验证

本插件使用与 DSH 客户端插件一致的手写 bundle 格式：`window.__ModuleLoader__.load({ id, factory })`，不需要额外编译器或运行时依赖。

在项目根目录执行：

```powershell
npm run check
npm run build
```

`npm run build` 会执行 host/client 语法检查、版本比较自测和包完整性检查。

## 更新日志

### v1.0.1

- 修复 scoped npm 包的 DSH bundle 导入名，保持运行时插件 ID 不变。

### v1.0.0

- 首次发布 DSH Web 版本显示插件。
- 支持运行时读取 DSH 版本、npm registry 更新检查、手动刷新和 Toast 提示。
- 支持侧边栏响应式布局、浅色/深色主题以及中英文界面。
- 增加版本比较、超时控制和版本不可用时的安全回退。

## 作者

作者：Jack·Huang<br>
邮箱：[jack698698@gmail.com](mailto:jack698698@gmail.com)

## License

本项目以 [MIT License](LICENSE) 发布。Copyright © 2026 Jack·Huang。
