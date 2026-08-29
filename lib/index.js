// dsh-sm-version-display — host half.
//
// Publishes the installed deepseek-harness version to the web page as
// `window.__DSH_VERSION__` by contributing a `global` row to the webserver's
// index injection table. The value is read at render time from the installed
// `@deepseek-ai/dsh` package manifest, so it always reflects the version the
// running server was started with — after a dsh upgrade the next start reports
// the new version without touching this plugin.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { settingsNamespace } from "@deepseek-ai/dsh-settings";
import z from "@deepseek-ai/schemastery";

/** Stable cordis plugin name. */
const name = "dsh-sm-version-display";

/** Services required before the injection row can be contributed. */
const inject = ["webServer", "settings"];

const require = createRequire(import.meta.url);

/** Candidate package manifests whose version tracks the harness version. */
const VERSION_CANDIDATES = [
	"@deepseek-ai/dsh/package.json",
	"@deepseek-ai/dsh-web-app/package.json"
];

/**
* Read the running harness version from the installed packages.
* @returns the version string, or "unknown" when nothing resolves.
*/
function resolveDshVersion() {
	const resolved = resolveDshPackage();
	return resolved?.version ?? "unknown";
}

/** Resolve the package manifest that identifies the running DSH process. */
function resolveDshPackage() {
	for (const spec of VERSION_CANDIDATES) {
		try {
			const pkgPath = require.resolve(spec);
			const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
			if (typeof pkg.version === "string" && pkg.version !== "") return { pkgPath, version: pkg.version };
		} catch {
			// try the next candidate
		}
	}
	return undefined;
}

/**
 * Classify the local DSH launcher without exposing the resolved filesystem path.
 * The DSH CLI currently uses pnpm for global installs and profile management.
 */
function resolveInstallInfo() {
	const resolved = resolveDshPackage();
	const path = resolved?.pkgPath?.replaceAll("\\", "/") ?? "";
	let method = "unknown";
	if (/_npx(?:\/|$)/i.test(path) || /npm-cache.*_npx/i.test(path)) method = "npx";
	else if (/(?:^|\/)\.pnpm(?:\/|$)/i.test(path) || /(?:^|\/)pnpm(?:\/|$)/i.test(path)) method = "pnpm";
	else if (/(?:^|\/)npm(?:\/|$).*node_modules|AppData\/Roaming\/npm/i.test(path)) method = "npm";
	return {
		method,
		profilePackageManager: "pnpm",
		canOneClick: method === "npm" || method === "pnpm"
	};
}

const SETTINGS_NAMESPACE = "dsh-sm-version-display";
const SettingsSchema = z.object({
	language: z.union([z.const("zh"), z.const("en"), z.const("zh-TW")]).default("zh"),
	enabled: z.boolean().default(true)
});
const UPDATE_ROUTE = "/api/dsh-sm-version-display/update";
const UPDATE_TOKEN = randomBytes(32).toString("hex");
let updateRunning = false;

function writeJson(res, status, value) {
	res.statusCode = status;
	res.setHeader("content-type", "application/json; charset=utf-8");
	res.setHeader("cache-control", "no-store");
	res.setHeader("x-content-type-options", "nosniff");
	res.end(JSON.stringify(value));
}

function isLoopbackAddress(address) {
	return address === "127.0.0.1" || address === "::1" || address === "::ffff:127.0.0.1";
}

function isLoopbackOrigin(origin) {
	if (origin === undefined || origin === "null") return true;
	try {
		return ["localhost", "127.0.0.1", "::1"].includes(new URL(origin).hostname);
	} catch {
		return false;
	}
}

function updateCommand(method) {
	const command = method === "npm"
		? { executable: "npm", args: ["install", "--global", "@deepseek-ai/dsh@latest"] }
		: method === "pnpm"
			? { executable: "pnpm", args: ["add", "--global", "@deepseek-ai/dsh@latest"] }
			: undefined;
	if (command === undefined) return undefined;
	if (process.platform !== "win32") return command;
	return {
		executable: process.env.ComSpec ?? "cmd.exe",
		args: ["/d", "/s", "/c", [command.executable, ...command.args].join(" ")]
	};
}

function runUpdate(command) {
	return new Promise((resolve) => {
		let settled = false;
		const child = spawn(command.executable, command.args, {
			stdio: ["ignore", "ignore", "ignore"],
			windowsHide: true,
			shell: false
		});
		const finish = (result) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			resolve(result);
		};
		const timer = setTimeout(() => {
			child.kill();
			finish({ ok: false, reason: "timeout" });
		}, 120000);
		child.once("error", () => finish({ ok: false, reason: "spawn-failed" }));
		child.once("close", (code) => finish(code === 0 ? { ok: true } : { ok: false, reason: "command-failed" }));
	});
}

function registerUpdateRoute(ctx) {
	ctx.effect(() => ctx.webServer.register({
		kind: "exact",
		path: UPDATE_ROUTE,
		handler: async (req, res) => {
			if (req.method !== "POST") {
				writeJson(res, 405, { ok: false, reason: "method-not-allowed" });
				return;
			}
			if (!isLoopbackAddress(req.socket.remoteAddress) || !isLoopbackOrigin(req.headers.origin)) {
				writeJson(res, 403, { ok: false, reason: "local-only" });
				return;
			}
			if (req.headers["x-dsh-sm-version-display-token"] !== UPDATE_TOKEN) {
				writeJson(res, 403, { ok: false, reason: "invalid-token" });
				return;
			}
			const info = resolveInstallInfo();
			const command = updateCommand(info.method);
			if (command === undefined || !info.canOneClick) {
				writeJson(res, 409, { ok: false, reason: "manual-only", method: info.method });
				return;
			}
			if (updateRunning) {
				writeJson(res, 409, { ok: false, reason: "already-running" });
				return;
			}
			updateRunning = true;
			try {
				const result = await runUpdate(command);
				writeJson(res, result.ok ? 200 : 500, { ...result, method: info.method, restartRequired: true });
			} finally {
				updateRunning = false;
			}
		}
	}), "dsh-sm-version-display: update route");
}

/**
* Contribute the version global on every index render.
* @param ctx - plugin context carrying the webServer service.
*/
function apply(ctx) {
	ctx.inject(["settings"], (settingsCtx) => {
		settingsCtx.settings.register(
			settingsNamespace(SETTINGS_NAMESPACE),
			SettingsSchema,
			{ applies: "live" }
		);
	});
	registerUpdateRoute(ctx);
	ctx.on("webserver/index-inject", (table) => {
		table.push({
			kind: "global",
			name: "__DSH_VERSION__",
			value: resolveDshVersion()
		});
		table.push({
			kind: "global",
			name: "__DSH_INSTALL_INFO__",
			value: resolveInstallInfo()
		});
		table.push({
			kind: "global",
			name: "__DSH_UPDATE_TOKEN__",
			value: UPDATE_TOKEN
		});
	});
}

export { apply, inject, name };
