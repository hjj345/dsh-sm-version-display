# dsh-sm-version-display — DeepSeek Harness 版本号显示插件

> 在 DeepSeek Harness Web GUI 侧边栏左下角「设置」按钮上方，以圆角卡片的形式实时显示 deepseek-harness 版本号，并自动检测 npm registry 上的最新版本。

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Node](https://img.shields.io/badge/Node.js-%3E%3D20-brightgreen.svg)
![Version](https://img.shields.io/badge/Version-v1.0-blue.svg)
![dsh](https://img.shields.io/badge/dsh-%3E%3D0.1.1--rc.2-orange.svg)
![Platform](https://img.shields.io/badge/Platform-Web-lightgrey.svg)
![Status](https://img.shields.io/badge/Status-Stable-green.svg)

---

## 简介

`dsh-sm-version-display`（npm 包名 `dsh-sm-version-display`）是 DeepSeek Harness（dsh）Web 表面的一个 **客户端 + host 双半区插件**。它把「当前安装的 dsh 版本号」以一张圆角矩形卡片展示在侧边栏底部、设置按钮的上方：

- 无新版本：`v0.1.1-rc.2 (最新版)`
- 有新版本：`v0.1.1-rc.2 (有更新 v0.1.1-rc.3)`

版本号 **运行时读取**，dsh 升级后无需改动插件即可自动显示新版本——插件本体安装在用户 web profile 中，是 dsh 官方插件机制下的**持久化扩展**。

## 功能特性

- 版本卡片：圆角矩形卡片（12px 圆角），独占一行，位于「设置」按钮正上方；
- 更新检测：加载时 + 每 30 分钟 + 窗口聚焦/回到前台时自动检查 npm registry 最新版（聚焦刷新带 5 分钟节流，避免打扰 registry）；
- 语义化比较：内置轻量 semver 比较器，正确处理 `0.1.1-rc.2` vs `0.1.1-rc.3`、RC 版 vs 正式版等场景；
- 自适应布局：卡片文本宽度不足时自动换行（`overflow-wrap: anywhere`）；侧边栏折叠为窄栏（56px rail）时显示圆形版本图标，不再空白；
- 主题适配：全部使用 dsh 设计系统变量（`--dsw-alias-*`、`--ds-font-family-code`），自动适配浅色 / 深色主题；
- 双语支持：简体中文 / English 随 dsh 界面语言自动切换；
- 悬停提示：鼠标悬停卡片或窄栏图标时，弹出提示框显示**加粗**的插件英文全名 `dsh-sm-version-display` 与当前版本文案；
- 手动刷新：卡片最右侧内置 dsh 原生样式的「刷新」按钮（明亮模式=黑底白字，黑暗模式自动适配），点击后真正检查一次 npm registry；检查中按钮切换为旋转加载图标；
- 结果提示：检查完成后弹出 dsh 原生 Toast（页面水平居中、靠上、4 秒自动消失）；无更新=绿色成功图标，有更新=蓝色信息图标并同时显示当前版本与最新版本，检查失败=红色错误提示；
- 升级自动跟随：host 半区在每次页面渲染时读取已安装 `@deepseek-ai/dsh` 的版本，dsh 升级重启后卡片显示新版本，零维护。

## 效果示意

```text
┌────────────────────────────┐
│  ☰  DSH Local Build  29b22c5│
│  ＋ 新会话                  │
│  （会话列表…）              │
│                            │
│  [插件运行]                 │  ← sidebar.footer.action（cordis）
│  ┌──────────────────────┐  │
│  │ v0.1.1-rc.2 (最新版) [刷新]│  │  ← 本插件卡片（独占一行）
│  └──────────────────────┘  │
│  ⚙ 设置                    │
└────────────────────────────┘
```

## 安装

### 方式一：官方插件命令（推荐，自动挂载）

```bash
dsh plugin --profile web add dsh-sm-version-display
```

### 方式二：本地开发目录直连（本项目采用）

在 `~/.dsh/profiles/web/` 的 `package.json` 中：

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

并在 `~/.dsh/profiles/web/node_modules/` 下建立 junction 链接到开发目录，然后**重启 `dsh web`** 即可生效。

> 注意：安装后需要重启一次 `dsh web` 服务（插件由启动时的 bundle 扫描加载）。

## 工作原理

```text
┌─────────────────────────────── dsh 进程（host）──────────────────────────────┐
│                                                                              │
│  dsh-sm-version-display/lib/index.js (host 半区)                                  │
│    ├─ 订阅 webserver/index-inject 事件                                          │
│    └─ 每次渲染 index.html 时读取 @deepseek-ai/dsh/package.json 的 version       │
│       并注入：globalThis["__DSH_VERSION__"] = "0.1.1-rc.2"                     │
└──────────────────────────────────────────────────────────────────────────────┘
                                   │ 浏览器加载页面
                                   ▼
┌─────────────────────────────── 浏览器（client）──────────────────────────────┐
│                                                                              │
│  dsh-sm-version-display/client/client.js (client 半区)                            │
│    ├─ 注册 sidebar.footer.action 列表槽条目（order: 100）                       │
│    ├─ 将 [data-slot="sidebar.footer.action"] 出口改为块级布局 → 独占一行         │
│    ├─ VersionCard 组件读取 window.__DSH_VERSION__ 显示当前版本                  │
│    └─ fetch https://registry.npmjs.org/@deepseek-ai/dsh/latest                 │
│        加载时 + 30 分钟 + 窗口聚焦时检查最新版并比较                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

| 文件 | 职责 |
|---|---|
| `lib/index.js` | host 半区：注入 `__DSH_VERSION__`（运行时读取，升级自动跟随） |
| `client/client.js` | client 半区：版本卡片组件 + 更新检测 + 槽注册 + 样式 |
| `cordis.patch.yml` | bundle 补丁：把插件插入 profile 的插件层栈 |
| `scripts/validate.mjs` | 构建验证：语法检查 + 版本比较逻辑自测 + 包完整性 |

## 开发与构建

本插件为**手写 bundle**（与 dsh 官方客户端插件同格式：`window.__ModuleLoader__.load({ id, factory })`），无需编译步骤：

```bash
npm run check      # 语法检查（lib + client）
npm run build      # 完整构建验证（语法 + 版本比较自测 + 包完整性）
node scripts/validate.mjs
```

目录结构：

```text
dsh-sm-version-display-2026.08.23/
├── package.json          # 包声明（dsh.client / dsh.bundle.patch / v1.0.0）
├── cordis.patch.yml      # bundle 补丁
├── lib/
│   └── index.js          # host 半区
├── client/
│   └── client.js         # client 半区（ModuleLoader bundle）
├── scripts/
│   └── validate.mjs      # 构建验证脚本
├── README.md
├── LICENSE               # MIT
└── .gitignore
```

## 升级兼容性

- **dsh 升级**：版本号由 host 半区在渲染时实时读取，升级重启后自动显示新版本；
- **插件持久化**：插件本体位于 `~/.dsh/profiles/web/`（用户数据目录），dsh 升级不会删除；
- **接口依赖**：仅使用 dsh 官方扩展点——`dsh.client` 声明、`sidebar.footer.action` 槽、`webserver/index-inject` 事件、`ctx.slots.inject/register`；与 dshmarket 等生态插件风险一致，如遇破坏性 API 变更仅需小幅适配。

## License

[MIT](./LICENSE) © 2026 hjj345
