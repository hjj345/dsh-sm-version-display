window.__ModuleLoader__.load({
	id: "@hjj345345/dsh-sm-version-display",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		const react = require("react");
		const primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		const h = react.createElement;
		const Fragment = react.Fragment;

		const PLUGIN_VERSION = "v1.1.0";
		const REGISTRY_URL = "https://registry.npmjs.org/@deepseek-ai/dsh/latest";
		const UPDATE_ROUTE = "/api/dsh-sm-version-display/update";
		const REFRESH_MS = 30 * 60 * 1000;
		const FOCUS_REFRESH_MIN_MS = 5 * 60 * 1000;
		const MIN_CHECK_GAP_MS = 15 * 1000;
		const FALLBACK_VERSION = "unknown";
		const INSTALL_PLUGIN_COMMAND = "dsh plugin --profile web add @hjj345345/dsh-sm-version-display";
		const DEFAULT_SETTINGS = { language: "zh", enabled: true };
		const LANGUAGE_OPTIONS = [
			{ value: "zh", label: "简体中文" },
			{ value: "en", label: "English" },
			{ value: "zh-TW", label: "繁體中文" }
		];

		const css = `
[data-slot="sidebar.footer.action"]{display:block!important;flex:1 1 auto;min-width:0}
.dvd_versionCard{box-sizing:border-box;display:flex;align-items:center;gap:8px;width:100%;min-width:0;margin:2px 0 6px;padding:7px 10px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;overflow:hidden}
.dvd_versionText{flex:1;min-width:0;white-space:normal;overflow-wrap:anywhere;word-break:normal}
.dvd_current{font-family:var(--ds-font-family-code);color:var(--dsw-alias-label-primary);font-weight:500}.dvd_meta{color:var(--dsw-alias-label-secondary)}
.dvd_railButton{box-sizing:border-box;cursor:pointer;width:36px;height:36px;color:var(--dsw-alias-label-primary);background:0 0;border:none;border-radius:50%;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.dvd_railButton:hover{background:var(--dsw-alias-interactive-bg-hover)}
.dvd_tipName{font-weight:600}.dvd_tipVersion{white-space:nowrap}.dvd_refreshBtn{flex:none}.dvd_spin{animation:dvd-spin .9s linear infinite}@keyframes dvd-spin{to{transform:rotate(360deg)}}
.dvd_toastSuccess{color:var(--dsw-alias-state-success-primary)}.dvd_toastInfo{color:var(--dsw-alias-state-business-primary)}.dvd_toastError{color:var(--dsw-alias-state-error-primary)}
.dvd-settings-page{box-sizing:border-box;width:100%;max-width:720px;padding:8px 0 36px;color:var(--dsw-alias-label-primary,#202124)}.dvd-settings-page *,.dvd-settings-page *::before,.dvd-settings-page *::after{box-sizing:border-box}
.dvd-settings-hero{display:flex;align-items:center;gap:14px;margin-bottom:16px;padding:16px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:16px;background:var(--dsw-alias-bg-layer-2,#fff);min-width:0}
.dvd-settings-icon{display:grid;place-items:center;width:54px;height:54px;flex:none;border-radius:16px;background:#f3f3f4;color:#161719;font-size:28px;line-height:1}.dvd-settings-hero-copy,.dvd-settings-copy-text{display:flex;min-width:0;flex:1;flex-direction:column}
.dvd-settings-title{font-size:16px;font-weight:600;line-height:24px;overflow-wrap:anywhere}.dvd-settings-subtitle,.dvd-settings-description,.dvd-settings-note{color:var(--dsw-alias-label-secondary,#73757a);font-size:12px;line-height:18px}
.dvd-settings-card{position:relative;min-width:0;margin-top:12px;padding:16px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:16px;background:var(--dsw-alias-bg-layer-2,#fff)}.dvd-settings-card h2{margin:0 0 8px;font-size:14px;font-weight:600;line-height:22px}
.dvd-settings-row{display:flex;min-width:0;align-items:center;gap:24px;min-height:58px;border-top:1px solid var(--dsw-alias-border-l4,rgba(0,0,0,.06))}.dvd-settings-label{font-size:13px;line-height:20px}.dvd-settings-language{justify-content:space-between}
.dvd-settings-select{width:190px;max-width:100%;min-height:34px;padding:6px 30px 6px 10px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.14));border-radius:9px;background:var(--dsw-alias-bg-layer-2,#fff);color:var(--dsw-alias-label-primary,#202124);cursor:pointer;font:inherit;font-size:12px}.dvd-settings-select:focus-visible{outline:2px solid var(--dsw-alias-border-focus,#4c7ef3);outline-offset:1px}.dvd-settings-select:disabled{opacity:.45;cursor:not-allowed}
.dvd-settings-switch{display:flex;align-items:center;gap:8px;cursor:pointer;flex:none}.dvd-settings-switch input{position:absolute;opacity:0;pointer-events:none}.dvd-settings-switch>span{position:relative;width:34px;height:20px;border-radius:999px;background:var(--dsw-alias-border-l2,#c6c7ca);transition:background-color .15s ease}.dvd-settings-switch>span::after{content:'';position:absolute;top:3px;left:3px;width:14px;height:14px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.18);transition:transform .15s ease}.dvd-settings-switch input:checked+span{background:#161719}.dvd-settings-switch input:checked+span::after{transform:translateX(14px)}.dvd-settings-switch input:focus-visible+span{outline:2px solid var(--dsw-alias-border-focus,#4c7ef3);outline-offset:2px}.dvd-settings-switch input:disabled+span{opacity:.45;cursor:not-allowed}.dvd-settings-switch b{min-width:44px;font-size:12px;font-weight:400}
.dvd-settings-check-row{display:flex;align-items:center;justify-content:space-between;gap:20px;min-width:0;min-height:72px;padding:12px 0;border-top:1px solid var(--dsw-alias-border-l4,rgba(0,0,0,.06))}.dvd-settings-check-actions{display:flex;align-items:center;gap:8px;flex:none}.dvd-settings-primary,.dvd-settings-secondary,.dvd-settings-copy,.dvd-settings-close{border-radius:9px;cursor:pointer;font:inherit;font-size:12px}.dvd-settings-primary{padding:7px 12px;border:1px solid #161719;background:#161719;color:#fff}.dvd-settings-primary:hover:not(:disabled){background:#2c2d30;border-color:#2c2d30}.dvd-settings-secondary{padding:7px 12px;border:1px solid var(--dsw-alias-border-l2,#c6c7ca);background:transparent;color:var(--dsw-alias-label-primary,#202124)}.dvd-settings-secondary:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.05))}.dvd-settings-primary:disabled,.dvd-settings-secondary:disabled,.dvd-settings-copy:disabled{opacity:.45;cursor:not-allowed}
.dvd-settings-check-result{margin-top:8px;padding:12px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:12px;background:var(--dsw-alias-bg-layer-1,rgba(0,0,0,.025))}.dvd-settings-check-result[data-kind="update"]{border-color:var(--dsw-alias-state-business-primary,#4c7ef3)}.dvd-settings-check-result[data-kind="error"]{border-color:var(--dsw-alias-state-danger,#d93025)}.dvd-settings-check-header{display:flex;align-items:center;justify-content:space-between;gap:12px}.dvd-settings-check-summary{font-size:13px;font-weight:600;line-height:20px}.dvd-settings-check-toggle{padding:2px 0;border:0;background:transparent;color:var(--dsw-alias-label-secondary,#73757a);cursor:pointer;font:inherit;font-size:12px}.dvd-settings-check-details{margin-top:10px;padding-top:10px;border-top:1px solid var(--dsw-alias-border-l4,rgba(0,0,0,.06));animation:dvd-expand .16s ease-out}@keyframes dvd-expand{from{opacity:0;transform:translateY(-3px)}to{opacity:1;transform:translateY(0)}}
.dvd-settings-facts{display:grid;grid-template-columns:150px minmax(0,1fr);gap:7px 14px;margin:0;font-size:12px;line-height:18px}.dvd-settings-facts dt{color:var(--dsw-alias-label-secondary,#73757a)}.dvd-settings-facts dd{margin:0;overflow-wrap:anywhere}.dvd-settings-update-actions{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:12px}.dvd-settings-update-hint,.dvd-settings-update-message{margin:9px 0 0;color:var(--dsw-alias-label-secondary,#73757a);font-size:12px;line-height:18px}.dvd-settings-update-message[data-kind="success"]{color:var(--dsw-alias-state-success-primary,#188038)}.dvd-settings-update-message[data-kind="error"]{color:var(--dsw-alias-state-danger,#d93025)}.dvd-settings-error{margin:10px 0 0;color:var(--dsw-alias-state-danger,#d93025);font-size:12px}.dvd-settings-note{margin:10px 0 0}
.dvd-settings-about dl{margin:0}.dvd-settings-about dl>div{display:grid;grid-template-columns:110px minmax(0,1fr);gap:16px;padding:7px 0;font-size:12px}.dvd-settings-about dt{color:var(--dsw-alias-label-secondary,#73757a)}.dvd-settings-about dd{margin:0;overflow-wrap:anywhere}.dvd-settings-about a{color:inherit}
.dvd-settings-command-box{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:14px;min-width:0;padding:7px 7px 7px 12px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:10px;background:#f3f3f4;font-size:12px}.dvd-settings-command-box code{display:block;min-width:0;color:#1a1c1f;overflow-wrap:anywhere;white-space:pre-wrap;word-break:break-word}.dvd-settings-copy{flex:none;padding:5px 9px;border:1px solid #161719;background:#161719;color:#fff;white-space:nowrap}.dvd-settings-copy:hover:not(:disabled){background:#2c2d30;border-color:#2c2d30}
.dvd-settings-modal-backdrop{position:fixed;z-index:100;inset:0;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,.38)}.dvd-settings-modal{width:min(680px,100%);max-height:min(760px,calc(100vh - 40px));overflow:auto;padding:20px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.14));border-radius:16px;background:var(--dsw-alias-bg-layer-2,#fff);box-shadow:0 18px 60px rgba(0,0,0,.22);color:var(--dsw-alias-label-primary,#202124)}.dvd-settings-modal h2{margin:0;font-size:16px;line-height:24px}.dvd-settings-modal>p{margin:6px 0 14px;color:var(--dsw-alias-label-secondary,#73757a);font-size:12px;line-height:18px}.dvd-settings-command-card{margin-top:12px;padding:12px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:12px}.dvd-settings-command-card h3{margin:0 0 8px;font-size:13px;line-height:20px}.dvd-settings-command-card ol{margin:9px 0 0;padding-left:20px;color:var(--dsw-alias-label-secondary,#73757a);font-size:12px;line-height:19px}.dvd-settings-modal-footer{display:flex;justify-content:flex-end;margin-top:16px}.dvd-settings-close{padding:7px 12px;border:1px solid #161719;background:#161719;color:#fff}.dvd-settings-close:hover{background:#2c2d30;border-color:#2c2d30}
body[data-ds-dark-theme] .dvd-settings-icon{background:rgba(255,255,255,.1);color:#f1f1f3}body[data-ds-dark-theme] .dvd-settings-switch input:checked+span{background:#f1f1f3}body[data-ds-dark-theme] .dvd-settings-switch input:checked+span::after{background:#202124}body[data-ds-dark-theme] .dvd-settings-command-box{background:rgba(255,255,255,.08)}body[data-ds-dark-theme] .dvd-settings-command-box code{color:#f1f1f3}
@media (max-width:760px){.dvd-settings-check-row{align-items:flex-start;flex-direction:column;gap:10px;padding:12px 0}.dvd-settings-check-actions{width:100%;justify-content:flex-end}}@media (max-width:520px){.dvd-settings-hero{align-items:flex-start;flex-wrap:wrap;gap:12px;padding:14px}.dvd-settings-icon{width:48px;height:48px;font-size:24px}.dvd-settings-hero-copy{flex-basis:calc(100% - 60px)}.dvd-settings-switch{width:100%;justify-content:flex-end;padding-top:10px;border-top:1px solid var(--dsw-alias-border-l4,rgba(0,0,0,.06))}.dvd-settings-card{padding:14px}.dvd-settings-about dl>div{grid-template-columns:88px minmax(0,1fr);gap:10px}.dvd-settings-modal{padding:16px}}@media (max-width:360px){.dvd-settings-language{align-items:flex-start;flex-direction:column}.dvd-settings-select{width:100%}.dvd-settings-about dl>div{grid-template-columns:minmax(0,1fr);gap:2px}.dvd-settings-command-box{align-items:start;gap:10px;padding-left:10px}.dvd-settings-check-actions{align-items:stretch;flex-direction:column}.dvd-settings-check-actions button{width:100%}}@media (prefers-reduced-motion:reduce){.dvd-settings-switch>span,.dvd-settings-switch>span::after,.dvd-settings-check-details{transition:none;animation:none}}
`;
		const STYLE_ID = "dvd-settings-and-version-styles";
		if (typeof document !== "undefined" && document.getElementById(STYLE_ID) === null) {
			const style = document.createElement("style");
			style.id = STYLE_ID;
			style.textContent = css;
			document.head.appendChild(style);
		}

		function parseVersion(value) {
			const match = String(value).trim().match(/^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/);
			if (match === null) return null;
			return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]), pre: match[4] === undefined ? null : match[4].split(".") };
		}
		function compareVersions(a, b) {
			const pa = parseVersion(a);
			const pb = parseVersion(b);
			if (pa === null || pb === null) return null;
			for (const key of ["major", "minor", "patch"]) if (pa[key] !== pb[key]) return pa[key] < pb[key] ? -1 : 1;
			if (pa.pre === null && pb.pre === null) return 0;
			if (pa.pre === null) return 1;
			if (pb.pre === null) return -1;
			const length = Math.max(pa.pre.length, pb.pre.length);
			for (let i = 0; i < length; i++) {
				const x = pa.pre[i];
				const y = pb.pre[i];
				if (x === undefined) return -1;
				if (y === undefined) return 1;
				if (x === y) continue;
				const xn = /^\d+$/.test(x);
				const yn = /^\d+$/.test(y);
				if (xn && yn) return Number(x) < Number(y) ? -1 : 1;
				if (xn) return -1;
				if (yn) return 1;
				return x < y ? -1 : 1;
			}
			return 0;
		}
		function formatVersion(value) {
			if (parseVersion(value) === null) return FALLBACK_VERSION;
			const text = String(value).trim();
			return text.startsWith("v") ? text : "v" + text;
		}
		function getCurrentVersion() {
			return typeof window !== "undefined" && typeof window.__DSH_VERSION__ === "string" && window.__DSH_VERSION__ !== "" ? window.__DSH_VERSION__ : FALLBACK_VERSION;
		}
		function getInstallInfo() {
			const info = typeof window !== "undefined" ? window.__DSH_INSTALL_INFO__ : undefined;
			if (info !== null && typeof info === "object") return { method: "unknown", profilePackageManager: "pnpm", canOneClick: false, ...info };
			return { method: "unknown", profilePackageManager: "pnpm", canOneClick: false };
		}
		async function fetchLatestVersion() {
			const response = await fetch(REGISTRY_URL, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(8000) });
			if (!response.ok) throw new Error("registry responded " + response.status);
			const data = await response.json();
			if (typeof data?.version !== "string" || parseVersion(data.version) === null) throw new Error("invalid registry version");
			return data.version;
		}
		async function checkDshVersion() {
			const current = getCurrentVersion();
			const latest = await fetchLatestVersion();
			return { current, latest, comparison: compareVersions(latest, current), checkedAt: Date.now() };
		}

		const zh = {
			latest: "最新版", update: "有更新", unknown: "版本未知", refresh: "刷新", "toast.latest": "已是最新版本 {version}", "toast.update": "发现新版本 {latest}，当前版本 {current}", "toast.error": "版本检查失败，请稍后重试",
			"settings.nav": "DSH版本检测", "settings.subtitle": "检测 DSH 版本并管理更新方式。", "settings.general": "通用设置", "settings.enabled": "已启用", "settings.disabled": "已关闭", "settings.languageLabel": "语言/Language", "settings.checkVersion": "检测DSH版本", "settings.checkVersionDesc": "检测本机已安装版本与 npm 仓库中的最新版本。", "settings.checking": "正在检测…",
			"settings.currentVersion": "本地已安装版本", "settings.latestVersion": "npm 最新版本", "settings.installMethod": "当前使用方式", "settings.profilePackageManager": "插件管理方式", "settings.method.npm": "npm 全局安装", "settings.method.pnpm": "pnpm 全局安装", "settings.method.npx": "npx 临时执行", "settings.method.unknown": "无法识别", "settings.latestStatus": "当前已是最新版本", "settings.updateFound": "发现可用的新版本", "settings.unknownStatus": "当前版本暂时无法识别", "settings.checkError": "版本检测失败，请稍后重试。",
			"settings.collapse": "收起检测结果", "settings.expand": "展开检测结果", "settings.updateNow": "一键更新", "settings.updateCommand": "更新命令", "settings.updating": "更新中…", "settings.updateUnavailable": "当前安装方式不支持安全的一键更新，请使用更新命令完成操作。", "settings.updateSuccess": "更新命令已执行，请重启 DSH 后生效。", "settings.updateFailed": "更新未完成，请使用更新命令手动操作。", "settings.restart": "更新 DSH 后需要重新启动 Web 服务。",
			"settings.commandModalTitle": "DSH 更新命令与步骤", "settings.commandModalDescription": "请选择与你的使用方式相符的命令。npm 用于全局安装，npx 用于临时执行；当前检测到的方式会优先显示。", "settings.command.npm": "npm 方式（全局安装）", "settings.command.npx": "npx 方式（临时执行）", "settings.command.pnpm": "当前方式：pnpm（全局安装）", "settings.stepStop": "先关闭正在运行的 DSH Web 服务。", "settings.stepUpdate": "执行上方命令，等待安装完成。", "settings.stepRestart": "重新启动 DSH Web 服务并重新打开页面。", "settings.stepNpx": "以后使用此命令启动时会自动使用最新版本。", "settings.writeError": "设置保存失败，请稍后重试。", "settings.copy": "复制", "settings.copied": "已复制", "settings.copyError": "复制失败，请手动选择命令。", "settings.close": "关闭",
			"settings.about": "关于插件", "settings.version": "插件版本", "settings.releaseDate": "发布日期", "settings.author": "作者", "settings.email": "邮箱", "settings.install": "安装命令"
		};
		const en = {
			latest: "Latest", update: "Update available", unknown: "Version unavailable", refresh: "Refresh", "toast.latest": "You are on the latest version {version}", "toast.update": "New version {latest} available (current: {current})", "toast.error": "Version check failed, please try again later",
			"settings.nav": "DSH Version Checker", "settings.subtitle": "Check the DSH version and manage update methods.", "settings.general": "General settings", "settings.enabled": "Enabled", "settings.disabled": "Disabled", "settings.languageLabel": "语言/Language", "settings.checkVersion": "Check DSH version", "settings.checkVersionDesc": "Compare the installed version with the latest npm release.", "settings.checking": "Checking…",
			"settings.currentVersion": "Installed version", "settings.latestVersion": "Latest npm version", "settings.installMethod": "Current method", "settings.profilePackageManager": "Plugin manager", "settings.method.npm": "npm global install", "settings.method.pnpm": "pnpm global install", "settings.method.npx": "npx temporary execution", "settings.method.unknown": "Unable to detect", "settings.latestStatus": "You are on the latest version", "settings.updateFound": "A newer version is available", "settings.unknownStatus": "The current version cannot be identified", "settings.checkError": "Version check failed. Try again later.",
			"settings.collapse": "Collapse result", "settings.expand": "Expand result", "settings.updateNow": "Update now", "settings.updateCommand": "Update commands", "settings.updating": "Updating…", "settings.updateUnavailable": "This installation method cannot be updated safely in place. Use the update commands.", "settings.updateSuccess": "The update command finished. Restart DSH for it to take effect.", "settings.updateFailed": "The update did not finish. Use the update commands manually.", "settings.restart": "Restart the DSH Web service after updating.",
			"settings.commandModalTitle": "DSH update commands and steps", "settings.commandModalDescription": "Choose the command that matches your setup. npm is for global installs; npx runs the latest package temporarily. The detected method is shown first.", "settings.command.npm": "npm (global install)", "settings.command.npx": "npx (temporary execution)", "settings.command.pnpm": "Detected method: pnpm (global install)", "settings.stepStop": "Close the running DSH Web service first.", "settings.stepUpdate": "Run the command above and wait for it to finish.", "settings.stepRestart": "Restart the DSH Web service and reopen the page.", "settings.stepNpx": "Future launches with this command will use the latest version automatically.", "settings.writeError": "Could not save the setting. Try again.", "settings.copy": "Copy", "settings.copied": "Copied", "settings.copyError": "Copy failed. Select the command manually.", "settings.close": "Close",
			"settings.about": "About", "settings.version": "Plugin version", "settings.releaseDate": "Release date", "settings.author": "Author", "settings.email": "Email", "settings.install": "Install command"
		};
		const zhTW = { ...zh, "settings.nav": "DSH 版本檢測", "settings.subtitle": "檢測 DSH 版本並管理更新方式。", "settings.general": "通用設定", "settings.enabled": "已啟用", "settings.disabled": "已關閉", "settings.languageLabel": "語言/Language", "settings.checkVersion": "檢測 DSH 版本", "settings.checkVersionDesc": "比較本機已安裝版本與 npm 儲存庫中的最新版本。", "settings.checking": "正在檢測…", "settings.currentVersion": "本機已安裝版本", "settings.latestVersion": "npm 最新版本", "settings.installMethod": "目前使用方式", "settings.profilePackageManager": "外掛管理方式", "settings.method.npm": "npm 全域安裝", "settings.method.pnpm": "pnpm 全域安裝", "settings.method.npx": "npx 臨時執行", "settings.method.unknown": "無法識別", "settings.latestStatus": "目前已是最新版本", "settings.updateFound": "發現可用的新版本", "settings.unknownStatus": "目前版本暫時無法識別", "settings.checkError": "版本檢測失敗，請稍後再試。", "settings.collapse": "收起檢測結果", "settings.expand": "展開檢測結果", "settings.updateNow": "一鍵更新", "settings.updateCommand": "更新命令", "settings.updating": "更新中…", "settings.updateUnavailable": "目前安裝方式不支援安全的一鍵更新，請使用更新命令完成操作。", "settings.updateSuccess": "更新命令已執行，請重新啟動 DSH 後生效。", "settings.updateFailed": "更新未完成，請使用更新命令手動操作。", "settings.restart": "更新 DSH 後需要重新啟動 Web 服務。", "settings.commandModalTitle": "DSH 更新命令與步驟", "settings.commandModalDescription": "請選擇符合使用方式的命令。npm 用於全域安裝，npx 用於臨時執行；目前檢測方式會優先顯示。", "settings.command.npm": "npm 方式（全域安裝）", "settings.command.npx": "npx 方式（臨時執行）", "settings.command.pnpm": "目前方式：pnpm（全域安裝）", "settings.stepStop": "先關閉正在執行的 DSH Web 服務。", "settings.stepUpdate": "執行上方命令並等待安裝完成。", "settings.stepRestart": "重新啟動 DSH Web 服務並重新開啟頁面。", "settings.stepNpx": "之後使用此命令啟動時會自動使用最新版本。", "settings.writeError": "設定儲存失敗，請稍後再試。", "settings.copy": "複製", "settings.copied": "已複製", "settings.copyError": "複製失敗，請手動選取命令。", "settings.close": "關閉", "settings.about": "關於外掛", "settings.version": "外掛版本", "settings.releaseDate": "發布日期", "settings.author": "作者", "settings.email": "電子郵件", "settings.install": "安裝命令" };
		const dictionaries = { zh, en, "zh-TW": zhTW };
		function translate(language, key, values) {
			let text = dictionaries[language]?.[key] ?? dictionaries.zh[key] ?? key;
			for (const [name, value] of Object.entries(values ?? {})) text = text.replace("{" + name + "}", String(value));
			return text;
		}
		function decodeSettings(value) {
			if (value === null || typeof value !== "object") return { ...DEFAULT_SETTINGS };
			return { language: ["zh", "en", "zh-TW"].includes(value.language) ? value.language : DEFAULT_SETTINGS.language, enabled: typeof value.enabled === "boolean" ? value.enabled : DEFAULT_SETTINGS.enabled };
		}
		function useSettingsSnapshot(scope) {
			const subscribe = react.useCallback((listener) => scope.subscribe(listener), [scope]);
			const getSnapshot = react.useCallback(() => scope.getSnapshot(), [scope]);
			const snapshot = react.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
			return { snapshot, settings: decodeSettings(snapshot.value) };
		}
		function installMethodLabel(method, t) {
			return t("settings.method." + (method === "npm" || method === "pnpm" || method === "npx" ? method : "unknown"));
		}
		function updateDefinition(method, t) {
			if (method === "npm") return { method, title: t("settings.command.npm"), command: "npm install --global @deepseek-ai/dsh@latest", steps: [t("settings.stepStop"), t("settings.stepUpdate"), t("settings.stepRestart")] };
			if (method === "npx") return { method, title: t("settings.command.npx"), command: "npx --yes @deepseek-ai/dsh@latest web", steps: [t("settings.stepStop"), t("settings.stepNpx"), t("settings.stepRestart")] };
			return { method: "pnpm", title: t("settings.command.pnpm"), command: "pnpm add --global @deepseek-ai/dsh@latest", steps: [t("settings.stepStop"), t("settings.stepUpdate"), t("settings.stepRestart")] };
		}
		function currentResultMeta(current, latest, t) {
			if (parseVersion(current) === null) return { kind: "error", title: t("settings.unknownStatus") };
			if (compareVersions(latest, current) === 1) return { kind: "update", title: t("settings.updateFound") };
			return { kind: "latest", title: t("settings.latestStatus") };
		}

		function VersionCard({ wide, t, scope }) {
			const { settings } = useSettingsSnapshot(scope);
			const [latest, setLatest] = react.useState(null);
			const [checking, setChecking] = react.useState(false);
			const [toast, setToast] = react.useState(null);
			const lastAttemptAt = react.useRef(0);
			const dismissToast = react.useCallback(() => setToast(null), []);
			const runCheck = react.useCallback(async () => {
				lastAttemptAt.current = Date.now();
				try {
					const result = await checkDshVersion();
					setLatest(result.latest);
					return result;
				} catch {
					return null;
				}
			}, []);
			const silentCheck = react.useCallback(() => {
				if (!settings.enabled) return;
				if (Date.now() - lastAttemptAt.current < MIN_CHECK_GAP_MS) return;
				runCheck().catch(() => {});
			}, [runCheck, settings.enabled]);
			react.useEffect(() => {
				if (!settings.enabled) return undefined;
				silentCheck();
				const timer = window.setInterval(silentCheck, REFRESH_MS);
				const onVisible = () => { if (document.visibilityState === "visible" && Date.now() - lastAttemptAt.current >= FOCUS_REFRESH_MIN_MS) silentCheck(); };
				window.addEventListener("focus", onVisible);
				document.addEventListener("visibilitychange", onVisible);
				return () => { window.clearInterval(timer); window.removeEventListener("focus", onVisible); document.removeEventListener("visibilitychange", onVisible); };
			}, [silentCheck]);
			const handleRefresh = react.useCallback(() => {
				if (checking) return;
				setChecking(true);
				runCheck().then((result) => {
					if (result === null) setToast({ kind: "error", seq: Date.now(), text: t("toast.error") });
					else if (result.comparison === 1) setToast({ kind: "update", seq: Date.now(), text: t("toast.update", { latest: formatVersion(result.latest), current: formatVersion(result.current) }) });
					else if (parseVersion(result.current) === null) setToast({ kind: "error", seq: Date.now(), text: t("unknown") });
					else setToast({ kind: "latest", seq: Date.now(), text: t("toast.latest", { version: formatVersion(result.current) }) });
				}).finally(() => setChecking(false));
			}, [checking, runCheck, t]);
			if (!settings.enabled) return null;
			const current = getCurrentVersion();
			const meta = parseVersion(current) === null ? t("unknown") : latest !== null && compareVersions(latest, current) === 1 ? t("update") + " " + formatVersion(latest) : t("latest");
			const tooltip = h(Fragment, null, h("strong", { className: "dvd_tipName" }, "dsh-sm-version-display"), h("br"), h("span", { className: "dvd_tipVersion" }, formatVersion(current) + " (" + meta + ")"));
			let toastElement = null;
			if (toast !== null) {
				const Icon = toast.kind === "latest" ? primitives.IconCheckOutline16 : toast.kind === "update" ? primitives.IconGlobeOutline14 : primitives.IconWarningOutline16;
				const colorClass = toast.kind === "latest" ? "dvd_toastSuccess" : toast.kind === "update" ? "dvd_toastInfo" : "dvd_toastError";
				toastElement = h(primitives.Toast, { key: toast.seq, text: toast.text, icon: h(Icon, { size: 16, className: colorClass }), onDone: dismissToast });
			}
			if (!wide) return h(Fragment, null, h(primitives.Tooltip, { label: tooltip, side: "right", delayMs: 300 }, h("button", { type: "button", className: "dvd_railButton", "aria-label": "dsh-sm-version-display" }, h(primitives.IconCodeOutline16, { size: 18 }))), toastElement);
			return h(Fragment, null, h(primitives.Tooltip, { label: tooltip, side: "right", delayMs: 300 }, h("div", { className: "dvd_versionCard" }, h("span", { className: "dvd_versionText" }, h("span", { className: "dvd_current" }, formatVersion(current)), " (", h("span", { className: "dvd_meta" }, meta), ")"), h(primitives.Button, { variant: "primary", size: "sm", className: "dvd_refreshBtn", onClick: handleRefresh, disabled: checking, icon: checking ? h(primitives.IconLoadingOutline16, { size: 14, className: "dvd_spin" }) : h(primitives.IconRefreshOutline16, { size: 14 }) }, t("refresh")))), toastElement);
		}

		function CommandBlock({ definition, onCopy, copied, copyLabel }) {
			return h("section", { className: "dvd-settings-command-card" }, h("h3", null, definition.title), h("div", { className: "dvd-settings-command-box" }, h("code", null, definition.command), h("button", { type: "button", className: "dvd-settings-copy", onClick: () => onCopy(definition.command) }, copied ? "✓" : copyLabel)), h("ol", null, definition.steps.map((step, index) => h("li", { key: index }, step))));
		}

		function CheckResultPanel({ state, t, installInfo, installMethod, onToggle, onUpdate, onCommands, updating, updateState }) {
			if (state.status === "checking") return h("div", { className: "dvd-settings-check-result", "data-kind": "checking", "aria-live": "polite" }, h("div", { className: "dvd-settings-check-summary" }, t("settings.checking")));
			if (state.status === "error") return h("div", { className: "dvd-settings-check-result", "data-kind": "error", "aria-live": "polite" }, h("div", { className: "dvd-settings-check-header" }, h("strong", { className: "dvd-settings-check-summary" }, t("settings.checkError")), h("button", { type: "button", className: "dvd-settings-check-toggle", onClick: onToggle, "aria-expanded": state.expanded }, state.expanded ? t("settings.collapse") : t("settings.expand"))), state.expanded ? h("div", { className: "dvd-settings-check-details" }, h("p", { className: "dvd-settings-note" }, t("settings.checkError"))) : null);
			if (state.status !== "success" || state.data === null) return null;
			const data = state.data;
			const meta = currentResultMeta(data.current, data.latest, t);
			const hasUpdate = meta.kind === "update";
			const updateContent = hasUpdate ? h(Fragment, null, h("div", { className: "dvd-settings-update-actions" }, h("button", { type: "button", className: "dvd-settings-primary", onClick: onUpdate, disabled: updating || !installInfo.canOneClick }, updating ? t("settings.updating") : t("settings.updateNow")), h("button", { type: "button", className: "dvd-settings-secondary", onClick: onCommands }, t("settings.updateCommand"))), !installInfo.canOneClick ? h("p", { className: "dvd-settings-update-hint" }, t("settings.updateUnavailable")) : null, updateState?.kind === "success" ? h("p", { className: "dvd-settings-update-message", "data-kind": "success" }, t("settings.updateSuccess"), " ", t("settings.restart")) : null, updateState?.kind === "error" ? h("p", { className: "dvd-settings-update-message", "data-kind": "error" }, t("settings.updateFailed")) : null) : null;
			return h("div", { className: "dvd-settings-check-result", "data-kind": meta.kind, "aria-live": "polite" }, h("div", { className: "dvd-settings-check-header" }, h("strong", { className: "dvd-settings-check-summary" }, meta.title), h("button", { type: "button", className: "dvd-settings-check-toggle", onClick: onToggle, "aria-expanded": state.expanded }, state.expanded ? t("settings.collapse") : t("settings.expand"))), state.expanded ? h("div", { className: "dvd-settings-check-details" }, h("dl", { className: "dvd-settings-facts" }, h("dt", null, t("settings.currentVersion")), h("dd", null, formatVersion(data.current)), h("dt", null, t("settings.latestVersion")), h("dd", null, formatVersion(data.latest)), h("dt", null, t("settings.installMethod")), h("dd", null, installMethod), h("dt", null, t("settings.profilePackageManager")), h("dd", null, installMethodLabel(installInfo.profilePackageManager, t))), updateContent) : null);
		}

		function UpdateCommandsModal({ definitions, t, copiedCommand, onCopy, onClose }) {
			return h("div", { className: "dvd-settings-modal-backdrop", role: "presentation", onMouseDown: (event) => { if (event.target === event.currentTarget) onClose(); } }, h("div", { className: "dvd-settings-modal", role: "dialog", "aria-modal": "true", "aria-labelledby": "dvd-settings-modal-title" }, h("h2", { id: "dvd-settings-modal-title" }, t("settings.commandModalTitle")), h("p", null, t("settings.commandModalDescription")), definitions.map((definition) => h(CommandBlock, { key: definition.method, definition, onCopy, copied: copiedCommand === definition.command, copyLabel: t("settings.copy") })), h("div", { className: "dvd-settings-modal-footer" }, h("button", { type: "button", className: "dvd-settings-close", onClick: onClose }, t("settings.close")))));
		}

		function VersionSettingsPage({ scope }) {
			const { snapshot, settings } = useSettingsSnapshot(scope);
			const t = (key, values) => translate(settings.language, key, values);
			const [error, setError] = react.useState(null);
			const [checkState, setCheckState] = react.useState({ status: "idle", data: null, expanded: true });
			const [updateState, setUpdateState] = react.useState(null);
			const [commandOpen, setCommandOpen] = react.useState(false);
			const [copiedCommand, setCopiedCommand] = react.useState(null);
			const [updating, setUpdating] = react.useState(false);
			const disabled = snapshot.writable === false;
			const installInfo = getInstallInfo();
			const installMethod = installMethodLabel(installInfo.method, t);
			const write = (field, value) => { setError(null); void scope.set(field, value).catch(() => setError("settings.writeError")); };
			react.useEffect(() => {
				if (!commandOpen) return undefined;
				const onKeyDown = (event) => { if (event.key === "Escape") setCommandOpen(false); };
				window.addEventListener("keydown", onKeyDown);
				return () => window.removeEventListener("keydown", onKeyDown);
			}, [commandOpen]);
			const handleCheck = () => {
				if (checkState.status === "checking") return;
				setUpdateState(null);
				setCheckState({ status: "checking", data: null, expanded: true });
				checkDshVersion().then((data) => setCheckState({ status: "success", data, expanded: true })).catch(() => setCheckState({ status: "error", data: null, expanded: true }));
			};
			const handleOneClickUpdate = async () => {
				if (updating) return;
				if (!installInfo.canOneClick) { setCommandOpen(true); return; }
				setUpdating(true);
				setUpdateState(null);
				try {
					const token = typeof window.__DSH_UPDATE_TOKEN__ === "string" ? window.__DSH_UPDATE_TOKEN__ : "";
					const response = await fetch(UPDATE_ROUTE, { method: "POST", headers: { accept: "application/json", "x-dsh-sm-version-display-token": token }, signal: AbortSignal.timeout(125000) });
					const payload = await response.json().catch(() => ({}));
					if (!response.ok || payload.ok !== true) throw new Error("update failed");
					setUpdateState({ kind: "success" });
				} catch {
					setUpdateState({ kind: "error" });
				} finally {
					setUpdating(false);
				}
			};
			const copyCommand = async (command) => {
				try {
					if (window.navigator.clipboard === undefined) throw new Error("clipboard unavailable");
					await window.navigator.clipboard.writeText(command);
					setCopiedCommand(command);
					window.setTimeout(() => setCopiedCommand((current) => current === command ? null : current), 1600);
				} catch {
					setError("settings.copyError");
				}
			};
			const detectedDefinition = ["npm", "npx", "pnpm"].includes(installInfo.method) ? updateDefinition(installInfo.method, t) : null;
			const definitions = [detectedDefinition, updateDefinition("npm", t), updateDefinition("npx", t)].filter((value, index, list) => value !== null && list.findIndex((item) => item.method === value.method) === index);
			const toggleResult = () => setCheckState((current) => ({ ...current, expanded: !current.expanded }));
			const hero = h("section", { className: "dvd-settings-hero" }, h("span", { className: "dvd-settings-icon", "aria-hidden": "true" }, "⚙"), h("span", { className: "dvd-settings-hero-copy" }, h("span", { className: "dvd-settings-title" }, "dsh-sm-version-display"), h("span", { className: "dvd-settings-subtitle" }, t("settings.subtitle"))), h("label", { className: "dvd-settings-switch" }, h("input", { type: "checkbox", checked: settings.enabled, disabled, onChange: (event) => write("enabled", event.target.checked) }), h("span", { "aria-hidden": "true" }), h("b", null, settings.enabled ? t("settings.enabled") : t("settings.disabled"))));
			const general = h("section", { className: "dvd-settings-card dvd-settings-general" }, h("h2", null, t("settings.general")), h("label", { className: "dvd-settings-row dvd-settings-language" }, h("span", { className: "dvd-settings-label" }, t("settings.languageLabel")), h("select", { className: "dvd-settings-select", value: settings.language, disabled, onChange: (event) => { if (["zh", "en", "zh-TW"].includes(event.target.value)) write("language", event.target.value); } }, LANGUAGE_OPTIONS.map((option) => h("option", { key: option.value, value: option.value }, option.label)))), h("div", { className: "dvd-settings-check-row" }, h("span", { className: "dvd-settings-copy-text" }, h("span", { className: "dvd-settings-label" }, t("settings.checkVersion")), h("span", { className: "dvd-settings-description" }, t("settings.checkVersionDesc"))), h("div", { className: "dvd-settings-check-actions" }, h("button", { type: "button", className: "dvd-settings-primary", onClick: handleCheck, disabled: checkState.status === "checking" }, checkState.status === "checking" ? t("settings.checking") : t("settings.checkVersion")))), h(CheckResultPanel, { state: checkState, t, installInfo, installMethod, onToggle: toggleResult, onUpdate: handleOneClickUpdate, onCommands: () => setCommandOpen(true), updating, updateState }));
			const aboutRows = [
				["settings.version", PLUGIN_VERSION],
				["settings.releaseDate", "2026-08-29"],
				["settings.author", "Jack·Huang"],
				["settings.email", h("a", { href: "mailto:jack698698@gmail.com" }, "jack698698@gmail.com")],
				["GitHub", h("a", { href: "https://github.com/hjj345/dsh-sm-version-display", target: "_blank", rel: "noreferrer" }, "hjj345/dsh-sm-version-display")],
				["npm", h("a", { href: "https://www.npmjs.com/package/@hjj345345/dsh-sm-version-display", target: "_blank", rel: "noreferrer" }, "@hjj345345/dsh-sm-version-display")]
			];
			const about = h("section", { className: "dvd-settings-card dvd-settings-about" }, h("h2", null, t("settings.about")), h("dl", null, aboutRows.map(([label, value]) => h("div", { key: label }, h("dt", null, label.startsWith("settings.") ? t(label) : label), h("dd", null, value)))));
			const install = h("section", { className: "dvd-settings-card" }, h("h2", null, t("settings.install")), h("div", { className: "dvd-settings-command-box" }, h("code", null, INSTALL_PLUGIN_COMMAND), h("button", { type: "button", className: "dvd-settings-copy", onClick: () => copyCommand(INSTALL_PLUGIN_COMMAND) }, copiedCommand === INSTALL_PLUGIN_COMMAND ? t("settings.copied") : t("settings.copy"))));
			const modal = commandOpen ? h(UpdateCommandsModal, { definitions, t, copiedCommand, onCopy: copyCommand, onClose: () => setCommandOpen(false) }) : null;
			return h(Fragment, null, h("div", { className: "dvd-settings-page" }, hero, error !== null ? h("p", { className: "dvd-settings-error", role: "alert" }, t(error)) : null, general, about, install), modal);
		}

		const NS = "dsh-sm-version-display";
		const inject = ["slots", "locale", "settingsScope"];
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, { zh, en }), "dsh-sm-version-display: dictionaries");
			const t = ctx.locale.bind(NS);
			const scope = ctx.settingsScope.bind({ namespace: NS, decode: decodeSettings });
			ctx.slots.inject("sidebar.footer.action", () => ctx.slots.register({ name: "sidebar.footer.action", id: "dsh-sm-version-display", order: 100, locale: NS, inject: () => ({ scope }) }, VersionCard));
			ctx.slots.inject("settings.section", () => ctx.slots.register({ name: "settings.section", id: "dsh-sm-version-display", order: 22, label: () => t("settings.nav"), inject: () => ({ scope }) }, VersionSettingsPage));
		}
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
