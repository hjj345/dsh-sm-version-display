window.__ModuleLoader__.load({
	id: "dsh-version-display",
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
		const css = "[data-slot=\"sidebar.footer.action\"]{display:block!important;flex:1 1 auto;min-width:0}.dvd_versionCard{box-sizing:border-box;width:100%;min-width:0;margin:2px 0 6px;padding:7px 10px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;text-align:left;overflow:hidden}.dvd_versionText{white-space:normal;overflow-wrap:anywhere;word-break:normal}.dvd_current{font-family:var(--ds-font-family-code);color:var(--dsw-alias-label-primary);font-weight:500}.dvd_meta{color:var(--dsw-alias-label-secondary)}.dvd_railButton{box-sizing:border-box;cursor:pointer;width:36px;height:36px;color:var(--dsw-alias-label-primary);background:0 0;border:none;border-radius:50%;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.dvd_railButton:hover{background:var(--dsw-alias-interactive-bg-hover)}.dvd_tipName{font-weight:600}.dvd_tipVersion{white-space:nowrap}";
		const tagId = "dsh-version-display/VersionCard.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-version-display";
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
		const FALLBACK_VERSION = "0.1.1-rc.2";
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
		const NS = "dsh-version-display";
		const zh = {
			"latest": "最新版",
			"update": "有更新"
		};
		const en = {
			"latest": "Latest",
			"update": "Update available:"
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
			const lastAttemptAt = react.useRef(0);
			const check = react.useCallback(() => {
				const now = Date.now();
				if (now - lastAttemptAt.current < MIN_CHECK_GAP_MS) return;
				lastAttemptAt.current = now;
				fetchLatestVersion().then((version) => {
					setLatest(version);
					setChecked(true);
				}, () => {
					setChecked(true);
				});
			}, []);
			react.useEffect(() => {
				check();
				const timer = window.setInterval(check, REFRESH_MS);
				const onVisible = () => {
					if (document.visibilityState !== "visible") return;
					if (Date.now() - lastAttemptAt.current >= FOCUS_REFRESH_MIN_MS) check();
				};
				window.addEventListener("focus", onVisible);
				document.addEventListener("visibilitychange", onVisible);
				return () => {
					window.clearInterval(timer);
					window.removeEventListener("focus", onVisible);
					document.removeEventListener("visibilitychange", onVisible);
				};
			}, [check]);
			const current = typeof window !== "undefined" && typeof window.__DSH_VERSION__ === "string" && window.__DSH_VERSION__ !== "" ? window.__DSH_VERSION__ : FALLBACK_VERSION;
			let meta;
			if (typeof latest === "string" && compareVersions(latest, current) === 1) {
				meta = t("update") + " v" + latest;
			} else {
				meta = t("latest");
			}
			const display = "v" + current + " (" + meta + ")";
			/** 悬浮提示：加粗插件英文全名 + 与卡片一致的版本文案。 */
			const tooltipLabel = (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, {
				children: [(0, react_jsx_runtime.jsx)("strong", {
					className: "dvd_tipName",
					children: "dsh-version-display"
				}), (0, react_jsx_runtime.jsx)("br", {}), (0, react_jsx_runtime.jsx)("span", {
					className: "dvd_tipVersion",
					children: display
				})]
			});
			if (!wide) {
				// 折叠窄栏（rail）模式：显示 36px 圆形图标按钮，悬停同样弹出提示
				return (0, react_jsx_runtime.jsx)(_primitives.Tooltip, {
					label: tooltipLabel,
					side: "right",
					delayMs: 300,
					children: (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: "dvd_railButton",
						"aria-label": "dsh-version-display",
						children: (0, react_jsx_runtime.jsx)(_primitives.IconCodeOutline16, { size: 18 })
					})
				});
			}
			return (0, react_jsx_runtime.jsx)(_primitives.Tooltip, {
				label: tooltipLabel,
				side: "right",
				delayMs: 300,
				children: (0, react_jsx_runtime.jsx)("div", {
					className: "dvd_versionCard",
					children: (0, react_jsx_runtime.jsxs)("span", {
						className: "dvd_versionText",
						children: [(0, react_jsx_runtime.jsx)("span", {
							className: "dvd_current",
							children: "v" + current
						}), " (", (0, react_jsx_runtime.jsx)("span", {
							className: "dvd_meta",
							children: meta
						}), ")"]
					})
				})
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
			ctx.effect(() => ctx.locale.register(NS, { zh, en }), "dsh-version-display: dictionaries");
			ctx.slots.inject("sidebar.footer.action", () => ctx.slots.register({
				name: "sidebar.footer.action",
				id: "dsh-version-display",
				order: 100,
				locale: NS
			}, VersionCard));
		}
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
