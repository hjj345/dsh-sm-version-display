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

		const PLUGIN_VERSION = "v1.2.0";
		const SETTINGS_ICON_DATA_URL = "data:image/png;base64,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";
		const CHECK_ROUTE = "/api/dsh-sm-version-display/check";
		const UPDATE_ROUTE = "/api/dsh-sm-version-display/update";
		const UPDATE_STATUS_ROUTE = "/api/dsh-sm-version-display/update/status";
		const REFRESH_MS = 30 * 60 * 1000;
		const FOCUS_REFRESH_MIN_MS = 5 * 60 * 1000;
		const MIN_CHECK_GAP_MS = 15 * 1000;
		const UPDATE_POLL_MS = 500;
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
.dvd-settings-icon{box-sizing:border-box;width:54px;height:54px;padding:5px;object-fit:contain;flex:none}.dvd-settings-hero-copy,.dvd-settings-copy-text{display:flex;min-width:0;flex:1;flex-direction:column}
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
body[data-ds-dark-theme] .dvd-settings-switch input:checked+span{background:#f1f1f3}body[data-ds-dark-theme] .dvd-settings-switch input:checked+span::after{background:#202124}body[data-ds-dark-theme] .dvd-settings-command-box{background:rgba(255,255,255,.08)}body[data-ds-dark-theme] .dvd-settings-command-box code{color:#f1f1f3}
@media (max-width:760px){.dvd-settings-check-row{align-items:flex-start;flex-direction:column;gap:10px;padding:12px 0}.dvd-settings-check-actions{width:100%;justify-content:flex-end}}@media (max-width:520px){.dvd-settings-hero{align-items:flex-start;flex-wrap:wrap;gap:12px;padding:14px}.dvd-settings-icon{width:48px;height:48px}.dvd-settings-hero-copy{flex-basis:calc(100% - 60px)}.dvd-settings-switch{width:100%;justify-content:flex-end;padding-top:10px;border-top:1px solid var(--dsw-alias-border-l4,rgba(0,0,0,.06))}.dvd-settings-card{padding:14px}.dvd-settings-about dl>div{grid-template-columns:88px minmax(0,1fr);gap:10px}.dvd-settings-modal{padding:16px}}@media (max-width:360px){.dvd-settings-language{align-items:flex-start;flex-direction:column}.dvd-settings-select{width:100%}.dvd-settings-about dl>div{grid-template-columns:minmax(0,1fr);gap:2px}.dvd-settings-command-box{align-items:start;gap:10px;padding-left:10px}.dvd-settings-check-actions{align-items:stretch;flex-direction:column}.dvd-settings-check-actions button{width:100%}}@media (prefers-reduced-motion:reduce){.dvd-settings-switch>span,.dvd-settings-switch>span::after,.dvd-settings-check-details{transition:none;animation:none}}
`;
		const STYLE_ID = "dvd-settings-and-version-styles";
		const extraCss = `.dvd-settings-version-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.dvd-settings-source-card{min-width:0;padding:12px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:12px;background:var(--dsw-alias-bg-layer-2,#fff)}.dvd-settings-source-card[data-kind="update"]{border-color:var(--dsw-alias-state-business-primary,#4c7ef3)}.dvd-settings-source-card[data-kind="error"]{border-color:var(--dsw-alias-state-danger,#d93025)}.dvd-settings-source-title{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;font-size:13px;font-weight:600}.dvd-settings-source-badge{padding:2px 6px;border-radius:999px;background:var(--dsw-alias-bg-layer-3,rgba(0,0,0,.06));color:var(--dsw-alias-label-secondary,#73757a);font-size:11px;font-weight:500;white-space:nowrap}.dvd-settings-source-card[data-kind="update"] .dvd-settings-source-badge{background:var(--dsw-alias-state-business-primary,#4c7ef3);color:#fff}.dvd-settings-source-facts{display:grid;grid-template-columns:104px minmax(0,1fr);gap:6px 10px;margin:0;font-size:12px;line-height:18px}.dvd-settings-source-facts dt{color:var(--dsw-alias-label-secondary,#73757a)}.dvd-settings-source-facts dd{min-width:0;margin:0;overflow-wrap:anywhere}.dvd-settings-source-facts a{color:inherit}.dvd-settings-source-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.dvd-settings-source-actions button{padding:6px 9px;border:1px solid #161719;border-radius:8px;cursor:pointer;font:inherit;font-size:12px}.dvd-settings-source-actions button:disabled{cursor:not-allowed;opacity:.55}.dvd-settings-source-hint{margin:8px 0 0;color:var(--dsw-alias-label-secondary,#73757a);font-size:11px;line-height:17px}.dvd-settings-update-log{margin-top:12px;padding:12px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:12px;background:#111315;color:#e7eaee}.dvd-settings-update-log h3{margin:0 0 8px;font-size:13px;line-height:20px}.dvd-settings-update-command{margin:0 0 8px;color:#aeb7c4;font-size:11px;line-height:16px;overflow-wrap:anywhere}.dvd-settings-update-output{max-height:180px;margin:0;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;color:#d7dde6;font:11px/17px var(--ds-font-family-code,monospace)}.dvd-settings-confirm-warning{padding:10px;border:1px solid var(--dsw-alias-state-danger,#d93025);border-radius:10px;background:rgba(217,48,37,.07);color:var(--dsw-alias-label-primary,#202124);font-size:12px;line-height:18px}.dvd-settings-modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}@media (max-width:760px){.dvd-settings-version-grid{grid-template-columns:1fr}}@media (max-width:520px){.dvd-settings-source-facts{grid-template-columns:92px minmax(0,1fr)}.dvd-settings-source-actions{flex-direction:column}.dvd-settings-source-actions button{width:100%}}`;
		if (typeof document !== "undefined" && document.getElementById(STYLE_ID) === null) {
			const style = document.createElement("style");
			style.id = STYLE_ID;
			style.textContent = css + extraCss;
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
		const checkStore = { state: { status: "idle", data: null, error: null, expanded: false, collapsedByUser: false }, listeners: new Set(), request: null, lastAttemptAt: 0 };
		const updateStore = { state: { status: "idle", job: null, error: null }, listeners: new Set(), pollJobId: null };
		const publish = (store, patch) => { store.state = { ...store.state, ...patch }; for (const listener of store.listeners) listener(); };
		function useStore(store) {
			const subscribe = react.useCallback((listener) => { store.listeners.add(listener); return () => store.listeners.delete(listener); }, [store]);
			const getSnapshot = react.useCallback(() => store.state, [store]);
			return react.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
		}
		function updateCheckState(data, status = "success", error = null) {
			publish(checkStore, { status, data, error, expanded: !checkStore.state.collapsedByUser, lastCheckedAt: data?.checkedAt ?? Date.now() });
		}
		async function requestCheck(force = false) {
			if (checkStore.request !== null) return checkStore.request;
			if (!force && Date.now() - checkStore.lastAttemptAt < MIN_CHECK_GAP_MS) return checkStore.state.data;
			checkStore.lastAttemptAt = Date.now();
			publish(checkStore, { status: "checking", error: null });
			const url = CHECK_ROUTE + (force ? "?force=1" : "");
			checkStore.request = fetch(url, { headers: { accept: "application/json", "x-dsh-sm-version-display-token": typeof window.__DSH_UPDATE_TOKEN__ === "string" ? window.__DSH_UPDATE_TOKEN__ : "" }, signal: AbortSignal.timeout(15000) }).then(async (response) => {
				const payload = await response.json().catch(() => ({}));
				if (!response.ok || payload.ok !== true) throw new Error("version check failed");
				updateCheckState(payload);
				return payload;
			}).catch((error) => {
				publish(checkStore, { status: checkStore.state.data === null ? "error" : "success", error });
				return null;
			}).finally(() => { checkStore.request = null; });
			return checkStore.request;
		}
		function startUpdatePolling(jobId) {
			if (updateStore.pollJobId === jobId) return;
			updateStore.pollJobId = jobId;
			const poll = async () => {
				try {
					const response = await fetch(UPDATE_STATUS_ROUTE, { headers: { accept: "application/json", "x-dsh-sm-version-display-token": typeof window.__DSH_UPDATE_TOKEN__ === "string" ? window.__DSH_UPDATE_TOKEN__ : "" }, signal: AbortSignal.timeout(8000) });
					const payload = await response.json().catch(() => ({}));
					if (!response.ok || payload.ok !== true) throw new Error("update status failed");
					publish(updateStore, { status: payload.job?.status ?? "error", job: payload.job ?? null, error: null });
					if (payload.job?.status === "running") window.setTimeout(poll, UPDATE_POLL_MS);
					else updateStore.pollJobId = null;
				} catch (error) {
					updateStore.pollJobId = null;
					const job = updateStore.state.job;
					publish(updateStore, { status: "error", job: job === null ? null : { ...job, status: "error", lines: [...(job.lines ?? []), String(error.message ?? error)] }, error });
				}
			};
			void poll();
		}
		function updateComparison(current, item) {
			if (item?.status !== "success" || parseVersion(current) === null) return null;
			return compareVersions(item.version, current);
		}
		function sourceMeta(current, item, t) {
			if (item?.status !== "success") return { kind: "error", title: t("settings.checkError") };
			const comparison = updateComparison(current, item);
			if (comparison === 1) return { kind: "update", title: t("settings.updateFound") };
			if (comparison === -1) return { kind: "newer", title: t("settings.currentNewer") };
			if (comparison === 0) return { kind: "latest", title: t("settings.latestStatus") };
			return { kind: "error", title: t("settings.unknownStatus") };
		}
		function releaseTypeLabel(type, t) { return t("settings.type." + type); }
		function formatDate(value) { return typeof value === "string" && value !== "" ? value.slice(0, 10) : "-"; }
		function updateDefinition(method, version, source, t, npmAvailable = true) {
			if (source === "github" && !npmAvailable) return { method: "source", title: t("settings.command.githubSource"), command: ["git clone https://github.com/deepseek-ai/deepseek-harness.git", "cd deepseek-harness", "git fetch --tags", "git checkout dsh-v" + version, "pnpm install", "pnpm run build", "pnpm dsh web"].join("\n"), steps: [t("settings.stepStop"), t("settings.stepSource"), t("settings.stepRestart")] };
			if (method === "npm") return { method, title: t("settings.command.npm"), command: "npm install --global @deepseek-ai/dsh@" + version, steps: [t("settings.stepStop"), t("settings.stepUpdate"), t("settings.stepRestart")] };
			if (method === "npx") return { method, title: t("settings.command.npx"), command: "npx --yes @deepseek-ai/dsh@" + version + " web", steps: [t("settings.stepStop"), t("settings.stepNpx"), t("settings.stepRestart")] };
			return { method: "pnpm", title: t("settings.command.pnpm"), command: "pnpm add --global @deepseek-ai/dsh@" + version, steps: [t("settings.stepStop"), t("settings.stepUpdate"), t("settings.stepRestart")] };
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
		Object.assign(zh, { "settings.checkVersionDesc": "检测本机已安装版本与 npm、GitHub 仓库中的最新版本。", "settings.source.npm": "npm 仓库", "settings.source.github": "GitHub 仓库", "settings.versionType": "版本类型", "settings.releaseTag": "Release 标签", "settings.releaseLink": "Release 链接", "settings.channel": "发布渠道", "settings.type.alpha": "预发布 Alpha", "settings.type.beta": "测试版 Beta", "settings.type.rc": "公测版 RC", "settings.type.release": "正式版 Release", "settings.currentNewer": "当前版本更高", "settings.checkComplete": "版本检测完成", "settings.githubManualOnly": "该 GitHub 版本暂无对应 npm 包，请按源码步骤手动更新。", "settings.confirmTitle": "确认更新 DSH", "settings.confirmTarget": "即将从 {source} 更新到 {version}（{type}）。", "settings.confirmWarning": "预发布版本可能包含不兼容变更。请先关闭 DSH Web 服务并确认已备份重要配置；更新完成后必须重新启动 DSH。", "settings.cancel": "取消", "settings.confirmUpdate": "确认并更新", "settings.updateLog": "更新执行记录", "settings.updateFinished": "已完成", "settings.waitingOutput": "等待命令输出…", "settings.command.githubSource": "GitHub 源码构建", "settings.stepSource": "按上方命令检出指定 Release 并完成源码构建。" });
		Object.assign(en, { "settings.checkVersionDesc": "Compare the installed version with the latest npm and GitHub releases.", "settings.source.npm": "npm registry", "settings.source.github": "GitHub release", "settings.versionType": "Release type", "settings.releaseTag": "Release tag", "settings.releaseLink": "Release link", "settings.channel": "Channel", "settings.type.alpha": "Alpha preview", "settings.type.beta": "Beta", "settings.type.rc": "Release candidate", "settings.type.release": "Release", "settings.currentNewer": "Current version is newer", "settings.checkComplete": "Version check complete", "settings.githubManualOnly": "No matching npm package is available; use the source steps manually.", "settings.confirmTitle": "Confirm DSH update", "settings.confirmTarget": "Update from {source} to {version} ({type}).", "settings.confirmWarning": "Preview releases may contain breaking changes. Close the DSH Web service and back up important configuration before continuing; restart DSH after the update.", "settings.cancel": "Cancel", "settings.confirmUpdate": "Confirm and update", "settings.updateLog": "Update execution", "settings.updateFinished": "Finished", "settings.waitingOutput": "Waiting for command output…", "settings.command.githubSource": "GitHub source build", "settings.stepSource": "Check out the selected Release and complete the source build with the commands above." });
		Object.assign(zhTW, { "settings.checkVersionDesc": "比較本機已安裝版本與 npm、GitHub 儲存庫中的最新版本。", "settings.source.npm": "npm 儲存庫", "settings.source.github": "GitHub 儲存庫", "settings.versionType": "版本類型", "settings.releaseTag": "Release 標籤", "settings.releaseLink": "Release 連結", "settings.channel": "發布渠道", "settings.type.alpha": "預發布 Alpha", "settings.type.beta": "測試版 Beta", "settings.type.rc": "公測版 RC", "settings.type.release": "正式版 Release", "settings.currentNewer": "目前版本較新", "settings.checkComplete": "版本檢測完成", "settings.githubManualOnly": "此 GitHub 版本暫無對應 npm 套件，請依原始碼步驟手動更新。", "settings.confirmTitle": "確認更新 DSH", "settings.confirmTarget": "即將從 {source} 更新至 {version}（{type}）。", "settings.confirmWarning": "預發布版本可能包含不相容變更。請先關閉 DSH Web 服務並確認已備份重要設定；更新完成後必須重新啟動 DSH。", "settings.cancel": "取消", "settings.confirmUpdate": "確認並更新", "settings.updateLog": "更新執行記錄", "settings.updateFinished": "已完成", "settings.waitingOutput": "等待命令輸出…", "settings.command.githubSource": "GitHub 原始碼建置", "settings.stepSource": "依上方命令檢出指定 Release 並完成原始碼建置。" });
		Object.assign(zh, { "settings.channel.latest": "稳定渠道 latest", "toast.update": "发现 {source} 新版本 {latest}，当前版本 {current}" });
		Object.assign(en, { "settings.channel.latest": "Stable channel (latest)", "toast.update": "New {source} version {latest} available (current: {current})" });
		Object.assign(zhTW, { "settings.channel.latest": "穩定渠道 latest", "toast.update": "發現 {source} 新版本 {latest}，目前版本 {current}" });
		Object.assign(zh, { "settings.githubRateLimited": "GitHub API 暂时限流，已尝试备用 Feed", "settings.githubUnavailable": "GitHub 检测暂时不可用", "settings.checkChannel": "检测通道", "settings.feed.api": "GitHub API", "settings.feed.atom": "GitHub Releases Feed", "settings.openRelease": "点击一键直达" });
		Object.assign(en, { "settings.githubRateLimited": "GitHub API is rate-limited; the fallback feed was also unavailable", "settings.githubUnavailable": "GitHub check is temporarily unavailable", "settings.checkChannel": "Check channel", "settings.feed.api": "GitHub API", "settings.feed.atom": "GitHub Releases Feed", "settings.openRelease": "Click to open", "settings.languageLabel": "语言/Language" });
		Object.assign(zhTW, { "settings.githubRateLimited": "GitHub API 暫時受限流，備用 Feed 也無法使用", "settings.githubUnavailable": "GitHub 檢測暫時無法使用", "settings.checkChannel": "檢測通道", "settings.feed.api": "GitHub API", "settings.feed.atom": "GitHub Releases Feed", "settings.openRelease": "點擊一鍵直達" });
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
		function sidebarSourceStatus(source, item, current, t) {
			const label = t("settings.source." + source);
			if (item?.status !== "success") return label + ": " + (source === "github" ? (item?.reason === "rate-limit" ? t("settings.githubRateLimited") : t("settings.githubUnavailable")) : t("settings.checkError"));
			const comparison = updateComparison(current, item);
			const state = comparison === 1 ? t("update") + " " + formatVersion(item.version) : comparison === -1 ? t("settings.currentNewer") : comparison === 0 ? t("latest") + " " + formatVersion(item.version) : t("unknown");
			return label + ": " + state;
		}

		function VersionCard({ wide, t, scope }) {
			const { settings } = useSettingsSnapshot(scope);
			const checkState = useStore(checkStore);
			const [checking, setChecking] = react.useState(false);
			const [toast, setToast] = react.useState(null);
			const dismissToast = react.useCallback(() => setToast(null), []);
			react.useEffect(() => {
				if (!settings.enabled) return undefined;
				requestCheck();
				const timer = window.setInterval(() => requestCheck(), REFRESH_MS);
				const onVisible = () => { if (document.visibilityState === "visible" && Date.now() - checkStore.lastAttemptAt >= FOCUS_REFRESH_MIN_MS) requestCheck(); };
				window.addEventListener("focus", onVisible);
				document.addEventListener("visibilitychange", onVisible);
				return () => { window.clearInterval(timer); window.removeEventListener("focus", onVisible); document.removeEventListener("visibilitychange", onVisible); };
			}, [settings.enabled]);
			const handleRefresh = react.useCallback(() => {
				if (checking) return;
				setChecking(true);
				requestCheck(true).then((result) => {
					if (result === null) setToast({ kind: "error", seq: Date.now(), text: t("toast.error") });
					else if ([result.npm, result.github].some((item) => updateComparison(result.current, item) === 1)) { const item = [result.npm, result.github].find((candidate) => updateComparison(result.current, candidate) === 1); const source = item === result.github ? t("settings.source.github") : t("settings.source.npm"); setToast({ kind: "update", seq: Date.now(), text: t("toast.update", { source, latest: formatVersion(item.version), current: formatVersion(result.current) }) }); }
					else if (parseVersion(result?.current) === null) setToast({ kind: "error", seq: Date.now(), text: t("unknown") });
					else setToast({ kind: "latest", seq: Date.now(), text: t("toast.latest", { version: formatVersion(result.current) }) });
				}).finally(() => setChecking(false));
			}, [checking, t]);
			if (!settings.enabled) return null;
			const current = checkState.data?.current ?? getCurrentVersion();
			const npm = checkState.data?.npm;
			const github = checkState.data?.github;
			const updateItem = [npm, github].find((item) => updateComparison(current, item) === 1);
			const meta = parseVersion(current) === null ? t("unknown") : updateItem !== undefined ? t("update") + " " + formatVersion(updateItem.version) : t("latest");
			const sourceStatuses = [sidebarSourceStatus("npm", npm, current, t), sidebarSourceStatus("github", github, current, t)];
			const tooltip = h(Fragment, null, h("strong", { className: "dvd_tipName" }, "dsh-sm-version-display"), h("br"), h("span", { className: "dvd_tipVersion" }, formatVersion(current) + " (" + meta + ")"), h("br"), h("span", { className: "dvd_tipVersion" }, sourceStatuses.join(" · ")));
			let toastElement = null;
			if (toast !== null) {
				const Icon = toast.kind === "latest" ? primitives.IconCheckOutline16 : toast.kind === "update" ? primitives.IconGlobeOutline14 : primitives.IconWarningOutline16;
				const colorClass = toast.kind === "latest" ? "dvd_toastSuccess" : toast.kind === "update" ? "dvd_toastInfo" : "dvd_toastError";
				toastElement = h(primitives.Toast, { key: toast.seq, text: toast.text, icon: h(Icon, { size: 16, className: colorClass }), onDone: dismissToast });
			}
			if (!wide) return h(Fragment, null, h(primitives.Tooltip, { label: tooltip, side: "right", delayMs: 300 }, h("button", { type: "button", className: "dvd_railButton", "aria-label": "dsh-sm-version-display" }, h(primitives.IconCodeOutline16, { size: 18 }))), toastElement);
			return h(Fragment, null, h(primitives.Tooltip, { label: tooltip, side: "right", delayMs: 300 }, h("div", { className: "dvd_versionCard" }, h("span", { className: "dvd_versionText" }, h("span", { className: "dvd_current" }, formatVersion(current)), " (", h("span", { className: "dvd_meta" }, meta), ")", h("span", { className: "dvd_sourceText" }, sourceStatuses.join(" · "))), h(primitives.Button, { variant: "primary", size: "sm", className: "dvd_refreshBtn", onClick: handleRefresh, disabled: checking, icon: checking ? h(primitives.IconLoadingOutline16, { size: 14, className: "dvd_spin" }) : h(primitives.IconRefreshOutline16, { size: 14 }) }, t("refresh")))), toastElement);
		}

		function CommandBlock({ definition, onCopy, copied, copyLabel }) {
			return h("section", { className: "dvd-settings-command-card" }, h("h3", null, definition.title), h("div", { className: "dvd-settings-command-box" }, h("code", null, definition.command), h("button", { type: "button", className: "dvd-settings-copy", onClick: () => onCopy(definition.command) }, copied ? "✓" : copyLabel)), h("ol", null, definition.steps.map((step, index) => h("li", { key: index }, step))));
		}

		function VersionSourceCard({ source, current, item, installInfo, installMethod, t, onUpdate, onCommands }) {
			const label = t("settings.source." + source);
			const meta = sourceMeta(current, item, t);
			if (item?.status !== "success") { const errorLabel = source === "github" ? (item?.reason === "rate-limit" ? t("settings.githubRateLimited") : t("settings.githubUnavailable")) : t("settings.checkError"); return h("section", { className: "dvd-settings-source-card", "data-kind": "error" }, h("div", { className: "dvd-settings-source-title" }, label, h("span", { className: "dvd-settings-source-badge" }, errorLabel)), h("p", { className: "dvd-settings-source-hint" }, errorLabel)); }
			const canUpdate = installInfo.canOneClick && (source !== "github" || item.npmAvailable === true);
			return h("section", { className: "dvd-settings-source-card", "data-kind": meta.kind }, h("div", { className: "dvd-settings-source-title" }, h("span", null, label), h("span", { className: "dvd-settings-source-badge" }, meta.title)), h("dl", { className: "dvd-settings-source-facts" }, h("dt", null, t("settings.currentVersion")), h("dd", null, formatVersion(current)), h("dt", null, t("settings.latestVersion")), h("dd", null, formatVersion(item.version)), h("dt", null, t("settings.versionType")), h("dd", null, releaseTypeLabel(item.type, t)), source === "github" ? h(Fragment, null, h("dt", null, t("settings.releaseDate")), h("dd", null, formatDate(item.publishedAt)), h("dt", null, t("settings.releaseTag")), h("dd", null, item.tagName), h("dt", null, t("settings.releaseLink")), h("dd", null, h("a", { href: item.url, target: "_blank", rel: "noreferrer" }, t("settings.openRelease"))), h("dt", null, t("settings.checkChannel")), h("dd", null, item.transport === "atom" ? t("settings.feed.atom") : t("settings.feed.api"))) : h(Fragment, null, h("dt", null, t("settings.channel")), h("dd", null, t("settings.channel." + item.channel))), h("dt", null, t("settings.installMethod")), h("dd", null, installMethod), h("dt", null, t("settings.profilePackageManager")), h("dd", null, installMethodLabel(installInfo.profilePackageManager, t))), meta.kind === "update" ? h(Fragment, null, h("div", { className: "dvd-settings-source-actions" }, h("button", { type: "button", className: "dvd-settings-primary", onClick: () => onUpdate(source, item), disabled: !canUpdate }, t("settings.updateNow")), h("button", { type: "button", className: "dvd-settings-secondary", onClick: () => onCommands(source, item) }, t("settings.updateCommand"))), !canUpdate ? h("p", { className: "dvd-settings-source-hint" }, source === "github" && item.npmAvailable !== true ? t("settings.githubManualOnly") : t("settings.updateUnavailable")) : null) : null);
		}
		function CheckResultPanel({ state, t, onToggle, onUpdate, onCommands }) {
			const data = state.data;
			if (data === null && state.status === "checking") return h("div", { className: "dvd-settings-check-result", "data-kind": "checking", "aria-live": "polite" }, h("div", { className: "dvd-settings-check-summary" }, t("settings.checking")));
			if (data === null) return h("div", { className: "dvd-settings-check-result", "data-kind": "error", "aria-live": "polite" }, h("div", { className: "dvd-settings-check-header" }, h("strong", { className: "dvd-settings-check-summary" }, t("settings.checkError")), h("button", { type: "button", className: "dvd-settings-check-toggle", onClick: onToggle, "aria-expanded": state.expanded }, state.expanded ? t("settings.collapse") : t("settings.expand"))));
			const installInfo = data.installInfo ?? { method: "unknown", profilePackageManager: "pnpm", canOneClick: false };
			const installMethod = installMethodLabel(installInfo.method, t);
			const hasUpdate = [data.npm, data.github].some((item) => updateComparison(data.current, item) === 1);
			const summary = state.status === "checking" ? t("settings.checking") : hasUpdate ? t("settings.updateFound") : t("settings.checkComplete");
			return h("div", { className: "dvd-settings-check-result", "data-kind": hasUpdate ? "update" : "latest", "aria-live": "polite" }, h("div", { className: "dvd-settings-check-header" }, h("strong", { className: "dvd-settings-check-summary" }, summary), h("button", { type: "button", className: "dvd-settings-check-toggle", onClick: onToggle, "aria-expanded": state.expanded }, state.expanded ? t("settings.collapse") : t("settings.expand"))), state.expanded ? h("div", { className: "dvd-settings-check-details" }, h("div", { className: "dvd-settings-version-grid" }, h(VersionSourceCard, { source: "npm", current: data.current, item: data.npm, installInfo, installMethod, t, onUpdate, onCommands }), h(VersionSourceCard, { source: "github", current: data.current, item: data.github, installInfo, installMethod, t, onUpdate, onCommands }))) : null);
		}
		function UpdateOutputPanel({ state, t }) {
			if (state.job === null || state.job?.status === "idle") return null;
			const job = state.job;
			const status = job.status === "running" ? t("settings.updating") : job.status === "success" ? t("settings.updateFinished") : t("settings.updateFailed");
			return h("section", { className: "dvd-settings-update-log", "aria-live": "polite" }, h("h3", null, t("settings.updateLog"), " · ", status), h("p", { className: "dvd-settings-update-command" }, job.command), h("pre", { className: "dvd-settings-update-output" }, job.lines?.join("\n") || t("settings.waitingOutput")), job.status === "success" ? h("p", { className: "dvd-settings-source-hint" }, t("settings.updateSuccess"), " ", t("settings.restart")) : job.status === "error" ? h("p", { className: "dvd-settings-source-hint" }, t("settings.updateFailed")) : null);
		}

		function UpdateCommandsModal({ definitions, t, copiedCommand, onCopy, onClose }) {
			return h("div", { className: "dvd-settings-modal-backdrop", role: "presentation", onMouseDown: (event) => { if (event.target === event.currentTarget) onClose(); } }, h("div", { className: "dvd-settings-modal", role: "dialog", "aria-modal": "true", "aria-labelledby": "dvd-settings-modal-title" }, h("h2", { id: "dvd-settings-modal-title" }, t("settings.commandModalTitle")), h("p", null, t("settings.commandModalDescription")), definitions.map((definition) => h(CommandBlock, { key: definition.method, definition, onCopy, copied: copiedCommand === definition.command, copyLabel: t("settings.copy") })), h("div", { className: "dvd-settings-modal-footer" }, h("button", { type: "button", className: "dvd-settings-close", onClick: onClose }, t("settings.close")))));
		}
		function UpdateConfirmModal({ target, t, onConfirm, onClose }) {
			const definition = updateDefinition(target.installInfo.method, target.item.version, target.source, t, target.item.npmAvailable !== false);
			return h("div", { className: "dvd-settings-modal-backdrop", role: "presentation", onMouseDown: (event) => { if (event.target === event.currentTarget) onClose(); } }, h("div", { className: "dvd-settings-modal", role: "dialog", "aria-modal": "true", "aria-labelledby": "dvd-settings-confirm-title" }, h("h2", { id: "dvd-settings-confirm-title" }, t("settings.confirmTitle")), h("p", null, t("settings.confirmTarget", { source: t("settings.source." + target.source), version: formatVersion(target.item.version), type: releaseTypeLabel(target.item.type, t) })), h("div", { className: "dvd-settings-confirm-warning" }, t("settings.confirmWarning")), h("p", { className: "dvd-settings-update-command" }, definition.command), h("div", { className: "dvd-settings-modal-actions" }, h("button", { type: "button", className: "dvd-settings-secondary", onClick: onClose }, t("settings.cancel")), h("button", { type: "button", className: "dvd-settings-primary", onClick: onConfirm }, t("settings.confirmUpdate")))));
		}

		function VersionSettingsPage({ scope }) {
			const { snapshot, settings } = useSettingsSnapshot(scope);
			const t = (key, values) => translate(settings.language, key, values);
			const checkState = useStore(checkStore);
			const updateState = useStore(updateStore);
			const [error, setError] = react.useState(null);
			const [commandOpen, setCommandOpen] = react.useState(false);
			const [commandDefinitions, setCommandDefinitions] = react.useState([]);
			const [copiedCommand, setCopiedCommand] = react.useState(null);
			const [confirmTarget, setConfirmTarget] = react.useState(null);
			const disabled = snapshot.writable === false;
			const installInfo = checkState.data?.installInfo ?? { method: "unknown", profilePackageManager: "pnpm", canOneClick: false };
			const installMethod = installMethodLabel(installInfo.method, t);
			const write = (field, value) => { setError(null); void scope.set(field, value).catch(() => setError("settings.writeError")); };
			react.useEffect(() => { if (settings.enabled) void requestCheck(); }, [settings.enabled]);
			react.useEffect(() => { if (updateState.job?.status === "running" && updateState.job.id) startUpdatePolling(updateState.job.id); }, [updateState.job?.id, updateState.job?.status]);
			react.useEffect(() => {
				if (!commandOpen) return undefined;
				const onKeyDown = (event) => { if (event.key === "Escape") setCommandOpen(false); };
				window.addEventListener("keydown", onKeyDown);
				return () => window.removeEventListener("keydown", onKeyDown);
			}, [commandOpen]);
			const handleCheck = () => {
			if (checkState.status !== "checking") void requestCheck(true);
			};
			const handleOneClickUpdate = async () => {
				const target = confirmTarget;
				if (target === null) return;
				setConfirmTarget(null);
				const definition = updateDefinition(installInfo.method, target.item.version, target.source, t, target.item.npmAvailable !== false);
				const emptyJob = { id: "pending", status: "running", source: target.source, version: target.item.version, method: installInfo.method, command: definition.command, lines: [] };
				publish(updateStore, { status: "running", job: emptyJob, error: null });
				try {
					const token = typeof window.__DSH_UPDATE_TOKEN__ === "string" ? window.__DSH_UPDATE_TOKEN__ : "";
					const response = await fetch(UPDATE_ROUTE, { method: "POST", headers: { accept: "application/json", "content-type": "application/json", "x-dsh-sm-version-display-token": token }, body: JSON.stringify({ source: target.source, version: target.item.version }), signal: AbortSignal.timeout(15000) });
					const payload = await response.json().catch(() => ({}));
					if (!response.ok || payload.ok !== true || payload.job?.id === undefined) throw new Error("update failed");
					publish(updateStore, { status: "running", job: payload.job, error: null });
					startUpdatePolling(payload.job.id);
				} catch (updateError) {
					publish(updateStore, { status: "error", job: { ...emptyJob, status: "error", lines: [String(updateError.message ?? updateError)] }, error: updateError });
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
			const openCommands = (source, item) => {
				const detectedMethod = ["npm", "pnpm", "npx"].includes(installInfo.method) ? installInfo.method : null;
				const methods = source === "github" && item.npmAvailable !== true ? ["source"] : [detectedMethod, "npm", "npx"].filter(Boolean);
				const definitions = methods.map((method) => method === "source" ? updateDefinition("unknown", item.version, source, t, false) : updateDefinition(method, item.version, source, t, true)).filter((value, index, list) => list.findIndex((item) => item.method === value.method) === index);
				setCommandDefinitions(definitions);
				setCommandOpen(true);
			};
			const requestUpdate = (source, item) => { if (installInfo.canOneClick && (source !== "github" || item.npmAvailable === true)) setConfirmTarget({ source, item, installInfo }); else openCommands(source, item); };
			const toggleResult = () => publish(checkStore, { expanded: !checkState.expanded, collapsedByUser: checkState.expanded ? true : checkState.collapsedByUser });
			const hero = h("section", { className: "dvd-settings-hero" }, h("img", { src: SETTINGS_ICON_DATA_URL, alt: "", className: "dvd-settings-icon" }), h("span", { className: "dvd-settings-hero-copy" }, h("span", { className: "dvd-settings-title" }, "dsh-sm-version-display"), h("span", { className: "dvd-settings-subtitle" }, t("settings.subtitle"))), h("label", { className: "dvd-settings-switch" }, h("input", { type: "checkbox", checked: settings.enabled, disabled, onChange: (event) => write("enabled", event.target.checked) }), h("span", { "aria-hidden": "true" }), h("b", null, settings.enabled ? t("settings.enabled") : t("settings.disabled"))));
			const general = h("section", { className: "dvd-settings-card dvd-settings-general" }, h("h2", null, t("settings.general")), h("label", { className: "dvd-settings-row dvd-settings-language" }, h("span", { className: "dvd-settings-label" }, t("settings.languageLabel")), h("select", { className: "dvd-settings-select", value: settings.language, disabled, onChange: (event) => { if (["zh", "en", "zh-TW"].includes(event.target.value)) write("language", event.target.value); } }, LANGUAGE_OPTIONS.map((option) => h("option", { key: option.value, value: option.value }, option.label)))), h("div", { className: "dvd-settings-check-row" }, h("span", { className: "dvd-settings-copy-text" }, h("span", { className: "dvd-settings-label" }, t("settings.checkVersion")), h("span", { className: "dvd-settings-description" }, t("settings.checkVersionDesc"))), h("div", { className: "dvd-settings-check-actions" }, h("button", { type: "button", className: "dvd-settings-primary", onClick: handleCheck, disabled: checkState.status === "checking" }, checkState.status === "checking" ? t("settings.checking") : t("settings.checkVersion")))), h(CheckResultPanel, { state: checkState, t, onToggle: toggleResult, onUpdate: requestUpdate, onCommands: openCommands }), h(UpdateOutputPanel, { state: updateState, t }));
			const aboutRows = [
				["settings.version", PLUGIN_VERSION],
				["settings.releaseDate", "2026-09-01"],
				["settings.author", "Jack·Huang"],
				["settings.email", h("a", { href: "mailto:jack698698@gmail.com" }, "jack698698@gmail.com")],
				["GitHub", h("a", { href: "https://github.com/hjj345/dsh-sm-version-display", target: "_blank", rel: "noreferrer" }, "https://github.com/hjj345/dsh-sm-version-display")],
				["npm", h("a", { href: "https://www.npmjs.com/package/@hjj345345/dsh-sm-version-display", target: "_blank", rel: "noreferrer" }, "@hjj345345/dsh-sm-version-display")]
			];
			const about = h("section", { className: "dvd-settings-card dvd-settings-about" }, h("h2", null, t("settings.about")), h("dl", null, aboutRows.map(([label, value]) => h("div", { key: label }, h("dt", null, label.startsWith("settings.") ? t(label) : label), h("dd", null, value)))));
			const install = h("section", { className: "dvd-settings-card" }, h("h2", null, t("settings.install")), h("div", { className: "dvd-settings-command-box" }, h("code", null, INSTALL_PLUGIN_COMMAND), h("button", { type: "button", className: "dvd-settings-copy", onClick: () => copyCommand(INSTALL_PLUGIN_COMMAND) }, copiedCommand === INSTALL_PLUGIN_COMMAND ? t("settings.copied") : t("settings.copy"))));
			const modal = commandOpen ? h(UpdateCommandsModal, { definitions: commandDefinitions, t, copiedCommand, onCopy: copyCommand, onClose: () => setCommandOpen(false) }) : null;
			const confirmModal = confirmTarget === null ? null : h(UpdateConfirmModal, { target: confirmTarget, t, onConfirm: handleOneClickUpdate, onClose: () => setConfirmTarget(null) });
			return h(Fragment, null, h("div", { className: "dvd-settings-page" }, hero, error !== null ? h("p", { className: "dvd-settings-error", role: "alert" }, t(error)) : null, general, about, install), modal, confirmModal);
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
