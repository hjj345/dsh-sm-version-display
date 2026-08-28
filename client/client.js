window.__ModuleLoader__.load({
	id: "dsh-sm-version-display",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		let _primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		//#region version card styles
		/**
		* Card + seat styles. The seat rule turns the footer-action outlet into a
		* block box so its entries stack on their own rows (the Cordis badge keeps
		* its row, the version card gets its own full-width row directly above the
		* Settings trigger). The outlet carries the stable data-slot attribute, so
		* the override survives sidebar rebuilds.
		*/
		const css = "[data-slot=\"sidebar.footer.action\"]{display:block!important;flex:1 1 auto;min-width:0}.dvd_versionCard{box-sizing:border-box;display:flex;align-items:center;gap:8px;width:100%;min-width:0;margin:2px 0 6px;padding:7px 10px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;overflow:hidden}.dvd_versionText{flex:1;min-width:0;white-space:normal;overflow-wrap:anywhere;word-break:normal}.dvd_current{font-family:var(--ds-font-family-code);color:var(--dsw-alias-label-primary);font-weight:500}.dvd_meta{color:var(--dsw-alias-label-secondary)}.dvd_railButton{box-sizing:border-box;cursor:pointer;width:36px;height:36px;color:var(--dsw-alias-label-primary);background:0 0;border:none;border-radius:50%;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.dvd_railButton:hover{background:var(--dsw-alias-interactive-bg-hover)}.dvd_tipName{font-weight:600}.dvd_tipVersion{white-space:nowrap}.dvd_refreshBtn{flex:none}.dvd_spin{animation:dvd-spin .9s linear infinite}@keyframes dvd-spin{to{transform:rotate(360deg)}}.dvd_toastSuccess{color:var(--dsw-alias-state-success-primary)}.dvd_toastInfo{color:var(--dsw-alias-state-business-primary)}.dvd_toastError{color:var(--dsw-alias-state-error-primary)}";
		const tagId = "dsh-sm-version-display/VersionCard.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-sm-version-display";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		//#endregion
		//#region version helpers
		/** npm registry endpoint for the latest published dsh version. */
		const REGISTRY_URL = "https://registry.npmjs.org/@deepseek-ai/dsh/latest";
		/** Refresh cadence: every 30 minutes, plus on window focus (throttled). */
		const REFRESH_MS = 30 * 60 * 1000;
		const FOCUS_REFRESH_MIN_MS = 5 * 60 * 1000;
		/** Debounce between manual checks so focus/visibility events cannot spam the registry. */
		const MIN_CHECK_GAP_MS = 15 * 1000;
		/** Fallback used only when the host-provided global is missing. */
		const FALLBACK_VERSION = "unknown";
		/**
		* Parse `X.Y.Z` optionally followed by a `-prerelease` (e.g. `0.1.1-rc.2`).
		* @param value - version string.
		* @returns normalized parts, or null when unparseable.
		*/
		function parseVersion(value) {
			const match = String(value).trim().match(/^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/);
			if (match === null) return null;
			return {
				major: Number(match[1]),
				minor: Number(match[2]),
				patch: Number(match[3]),
				pre: match[4] === void 0 ? null : match[4].split(".")
			};
		}
		/**
		* Compare two semver-ish strings.
		* @returns -1 when a < b, 1 when a > b, 0 when equal, null when unparseable.
		*/
		function compareVersions(a, b) {
			const pa = parseVersion(a);
			const pb = parseVersion(b);
			if (pa === null || pb === null) return null;
			for (const key of ["major", "minor", "patch"]) {
				if (pa[key] !== pb[key]) return pa[key] < pb[key] ? -1 : 1;
			}
			if (pa.pre === null && pb.pre === null) return 0;
			if (pa.pre === null) return 1;
			if (pb.pre === null) return -1;
			const length = Math.max(pa.pre.length, pb.pre.length);
			for (let i = 0; i < length; i++) {
				const x = pa.pre[i];
				const y = pb.pre[i];
				if (x === void 0) return -1;
				if (y === void 0) return 1;
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
		/** Format a valid version without duplicating a leading `v`; invalid values stay explicit. */
		function formatVersion(value) {
			if (parseVersion(value) === null) return "unknown";
			const text = String(value).trim();
			return text.startsWith("v") ? text : "v" + text;
		}
		/** Fetch the latest published dsh version from the npm registry. */
		async function fetchLatestVersion() {
			const response = await fetch(REGISTRY_URL, {
				headers: { accept: "application/json" },
				signal: AbortSignal.timeout(8000)
			});
			if (!response.ok) throw new Error("registry responded " + response.status);
			const data = await response.json();
			return typeof data?.version === "string" ? data.version : null;
		}
		//#endregion
		//#region locales
		const NS = "dsh-sm-version-display";
		const zh = {
			"latest": "最新版",
			"update": "有更新",
			"unknown": "版本未知",
			"refresh": "刷新",
			"toast.latest": "已是最新版本 {version}",
			"toast.update": "发现新版本 {latest}，当前版本 {current}",
			"toast.error": "版本检查失败，请稍后重试"
		};
		const en = {
			"latest": "Latest",
			"update": "Update available:",
			"unknown": "Version unavailable",
			"refresh": "Refresh",
			"toast.latest": "You are on the latest version {version}",
			"toast.update": "New version {latest} available (current: {current})",
			"toast.error": "Version check failed, please try again later"
		};
		//#endregion
		//#region VersionCard
		/**
		* Rounded card shown above the Settings trigger, on its own row.
		* @param props - composed slot props: `wide` (sidebar expanded flag) and `t` (locale binder).
		* @returns the card element, or null in the collapsed rail.
		*/
				function VersionCard({ wide, t }) {
			const [latest, setLatest] = react.useState(null);
			const [checked, setChecked] = react.useState(false);
			const [checking, setChecking] = react.useState(false);
			const [toast, setToast] = react.useState(null);
			const lastAttemptAt = react.useRef(0);
			const dismissToast = react.useCallback(() => {
				setToast(null);
			}, []);
			/**
			* 实际执行一次版本检查（fetch registry + 比较）。
			* @returns {Promise<{latest: string|null, current: string}|null>} null 表示检查失败。
			*/
			const runCheck = react.useCallback(async () => {
				lastAttemptAt.current = Date.now();
				try {
					const latest = await fetchLatestVersion();
					setLatest(latest);
					setChecked(true);
					const current = typeof window !== "undefined" && typeof window.__DSH_VERSION__ === "string" && window.__DSH_VERSION__ !== "" ? window.__DSH_VERSION__ : FALLBACK_VERSION;
					return { latest, current };
				} catch {
					setChecked(true);
					return null;
				}
			}, []);
			/** 静默自动检查（挂载/定时/聚焦，不弹提示），带节流。 */
			const silentCheck = react.useCallback(() => {
				if (Date.now() - lastAttemptAt.current < MIN_CHECK_GAP_MS) return;
				runCheck().catch(() => {});
			}, [runCheck]);
			react.useEffect(() => {
				silentCheck();
				const timer = window.setInterval(silentCheck, REFRESH_MS);
				const onVisible = () => {
					if (document.visibilityState !== "visible") return;
					if (Date.now() - lastAttemptAt.current >= FOCUS_REFRESH_MIN_MS) silentCheck();
				};
				window.addEventListener("focus", onVisible);
				document.addEventListener("visibilitychange", onVisible);
				return () => {
					window.clearInterval(timer);
					window.removeEventListener("focus", onVisible);
					document.removeEventListener("visibilitychange", onVisible);
				};
			}, [silentCheck]);
			/** 点击“刷新”按钮：真实检查 + 检查中状态 + 完成/失败 Toast 提示。 */
			const handleRefresh = react.useCallback(() => {
				if (checking) return;
				setChecking(true);
				runCheck().then((result) => {
					if (result === null) {
						setToast({ seq: Date.now(), kind: "error", text: t("toast.error") });
					} else if (typeof result.latest === "string" && compareVersions(result.latest, result.current) === 1) {
						setToast({ seq: Date.now(), kind: "update", text: t("toast.update", { latest: formatVersion(result.latest), current: formatVersion(result.current) }) });
					} else if (parseVersion(result.current) === null) {
						setToast({ seq: Date.now(), kind: "error", text: t("unknown") });
					} else {
						setToast({ seq: Date.now(), kind: "latest", text: t("toast.latest", { version: formatVersion(result.current) }) });
					}
				}, () => {
					setToast({ seq: Date.now(), kind: "error", text: t("toast.error") });
				}).finally(() => {
					setChecking(false);
				});
			}, [checking, runCheck, t]);
			const current = typeof window !== "undefined" && typeof window.__DSH_VERSION__ === "string" && window.__DSH_VERSION__ !== "" ? window.__DSH_VERSION__ : FALLBACK_VERSION;
			let meta;
			if (parseVersion(current) === null) {
				meta = t("unknown");
			} else if (typeof latest === "string" && compareVersions(latest, current) === 1) {
				meta = t("update") + " " + formatVersion(latest);
			} else {
				meta = t("latest");
			}
			const display = formatVersion(current) + " (" + meta + ")";
			/** 悬浮提示：加粗插件英文全名 + 与卡片一致的版本文案。 */
			const tooltipLabel = (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, {
				children: [(0, react_jsx_runtime.jsx)("strong", {
					className: "dvd_tipName",
					children: "dsh-sm-version-display"
				}), (0, react_jsx_runtime.jsx)("br", {}), (0, react_jsx_runtime.jsx)("span", {
					className: "dvd_tipVersion",
					children: display
				})]
			});
			/** Toast 元素：绿色成功 / 蓝色信息 / 红色错误（dsh 语义色令牌），仅手动检查后展示。 */
			let toastElement = null;
			if (toast !== null) {
				const Icon = toast.kind === "latest" ? _primitives.IconCheckOutline16 : toast.kind === "update" ? _primitives.IconGlobeOutline14 : _primitives.IconWarningOutline16;
				const colorClass = toast.kind === "latest" ? "dvd_toastSuccess" : toast.kind === "update" ? "dvd_toastInfo" : "dvd_toastError";
				toastElement = (0, react_jsx_runtime.jsx)(_primitives.Toast, {
					key: toast.seq,
					text: toast.text,
					icon: (0, react_jsx_runtime.jsx)(Icon, { size: 16, className: colorClass }),
					onDone: dismissToast
				});
			}
			if (!wide) {
				// 折叠窄栏（rail）模式：显示 36px 圆形图标按钮，悬停同样弹出提示
				return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, {
					children: [(0, react_jsx_runtime.jsx)(_primitives.Tooltip, {
						label: tooltipLabel,
						side: "right",
						delayMs: 300,
						children: (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "dvd_railButton",
							"aria-label": "dsh-sm-version-display",
							children: (0, react_jsx_runtime.jsx)(_primitives.IconCodeOutline16, { size: 18 })
						})
					}), toastElement]
				});
			}
			return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, {
				children: [(0, react_jsx_runtime.jsx)(_primitives.Tooltip, {
					label: tooltipLabel,
					side: "right",
					delayMs: 300,
					children: (0, react_jsx_runtime.jsx)("div", {
						className: "dvd_versionCard",
						children: [(0, react_jsx_runtime.jsxs)("span", {
							className: "dvd_versionText",
							children: [(0, react_jsx_runtime.jsx)("span", {
								className: "dvd_current",
								children: formatVersion(current)
							}), " (", (0, react_jsx_runtime.jsx)("span", {
								className: "dvd_meta",
								children: meta
							}), ")"]
						}), (0, react_jsx_runtime.jsx)(_primitives.Button, {
							variant: "primary",
							size: "sm",
							className: "dvd_refreshBtn",
							onClick: handleRefresh,
							disabled: checking,
							icon: checking ? (0, react_jsx_runtime.jsx)(_primitives.IconLoadingOutline16, { size: 14, className: "dvd_spin" }) : (0, react_jsx_runtime.jsx)(_primitives.IconRefreshOutline16, { size: 14 }),
							children: t("refresh")
						})]
					})
				}), toastElement]
			});
		}
				//#endregion
		/** Services required by the client half. */
		const inject = ["slots", "locale"];
		/**
		* Register the version card into the sidebar footer, above the Settings trigger.
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, { zh, en }), "dsh-sm-version-display: dictionaries");
			ctx.slots.inject("sidebar.footer.action", () => ctx.slots.register({
				name: "sidebar.footer.action",
				id: "dsh-sm-version-display",
				order: 100,
				locale: NS
			}, VersionCard));
		}
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
