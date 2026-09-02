// dsh-sm-version-display — host half.
//
// Publishes the installed DeepSeek Harness version and provides cached,
// loopback-only version/update APIs for the Web client.
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

const CHECK_ROUTE = "/api/dsh-sm-version-display/check";
const UPDATE_ROUTE = "/api/dsh-sm-version-display/update";
const UPDATE_STATUS_ROUTE = "/api/dsh-sm-version-display/update/status";
const UPDATE_TOKEN = randomBytes(32).toString("hex");
const NPM_LATEST_URL = "https://registry.npmjs.org/@deepseek-ai%2Fdsh/latest";
const NPM_PACKAGE_URL = "https://registry.npmjs.org/@deepseek-ai%2Fdsh";
const GITHUB_RELEASES_URL = "https://api.github.com/repos/deepseek-ai/deepseek-harness/releases?per_page=30";
const GITHUB_RELEASES_FEED_URL = "https://github.com/deepseek-ai/deepseek-harness/releases.atom";
const CHECK_TIMEOUT_MS = 10000;
const CHECK_CACHE_TTL_MS = 5 * 60 * 1000;
const UPDATE_TIMEOUT_MS = 120000;
let versionCheckCache;
let versionCheckPromise;
let updateJob;

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

/** Classify the local DSH launcher without exposing its resolved path. */
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

function writeJson(res, status, value) {
	res.statusCode = status;
	res.setHeader("content-type", "application/json; charset=utf-8");
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

function isAuthorized(req) {
	return isLoopbackAddress(req.socket.remoteAddress) && isLoopbackOrigin(req.headers.origin) && req.headers["x-dsh-sm-version-display-token"] === UPDATE_TOKEN;
}

function parseVersion(value) {
	const match = String(value ?? "").trim().match(/^v?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/);
	return match?.[1] ?? null;
}

function classifyRelease(version) {
	const match = String(version).match(/-(alpha|beta|rc)(?:[.-]|$)/i);
	if (match?.[1]?.toLowerCase() === "alpha") return "alpha";
	if (match?.[1]?.toLowerCase() === "beta") return "beta";
	if (match?.[1]?.toLowerCase() === "rc") return "rc";
	return String(version).includes("-") ? null : "release";
}

async function fetchJson(url, headers = {}) {
	const response = await fetch(url, { headers: { accept: "application/json", ...headers }, signal: AbortSignal.timeout(CHECK_TIMEOUT_MS) });
	if (!response.ok) {
		const error = new Error("request failed: " + response.status);
		error.status = response.status;
		throw error;
	}
	return response.json();
}

async function fetchText(url, headers = {}) {
	const response = await fetch(url, { headers: { accept: "text/plain, application/atom+xml", ...headers }, signal: AbortSignal.timeout(CHECK_TIMEOUT_MS) });
	if (!response.ok) throw new Error("request failed: " + response.status);
	return response.text();
}

async function fetchNpmLatest() {
	const data = await fetchJson(NPM_LATEST_URL);
	const version = parseVersion(data?.version);
	const type = version === null ? null : classifyRelease(version);
	if (version === null || type === null) throw new Error("invalid npm version");
	return { version, type, channel: "latest", url: "https://www.npmjs.com/package/@deepseek-ai/dsh" };
}

async function isNpmVersionAvailable(version) {
	try {
		const data = await fetchJson(NPM_PACKAGE_URL + "/" + encodeURIComponent(version));
		return data?.version === version;
	} catch {
		return false;
	}
}

function decodeXml(value) {
	return String(value).replaceAll("&amp;", "&").replaceAll("&lt;", "<").replaceAll("&gt;", ">") .replaceAll("&quot;", '"').replaceAll("&apos;", "'");
}

function readAtomTag(block, tag) {
	const match = block.match(new RegExp("<" + tag + "\\b[^>]*>([\\s\\S]*?)</" + tag + ">", "i"));
	return match === null ? null : decodeXml(match[1].trim());
}

async function createGithubResult(version, type, tagName, publishedAt, url, prerelease, transport) {
	return {
		version,
		type,
		prerelease,
		publishedAt,
		tagName,
		url: url.startsWith("https://github.com/deepseek-ai/deepseek-harness/releases/tag/") ? url : "https://github.com/deepseek-ai/deepseek-harness/releases/tag/" + encodeURIComponent(tagName),
		npmAvailable: await isNpmVersionAvailable(version),
		transport
	};
}

async function fetchGithubLatestFromApi() {
	const releases = await fetchJson(GITHUB_RELEASES_URL, {
		"user-agent": "dsh-sm-version-display",
		"x-github-api-version": "2022-11-28"
	});
	const candidates = Array.isArray(releases) ? releases.map((release) => {
		const version = parseVersion(String(release?.tag_name ?? "").replace(/^dsh-/, ""));
		const type = version === null ? null : classifyRelease(version);
		return version === null || type === null || release?.draft === true || typeof release?.published_at !== "string" ? null : { release, version, type };
	}).filter(Boolean).sort((a, b) => Date.parse(b.release.published_at) - Date.parse(a.release.published_at)) : [];
	const item = candidates[0];
	if (item === undefined) throw new Error("no published GitHub release");
	return createGithubResult(item.version, item.type, item.release.tag_name, item.release.published_at, "", item.release.prerelease === true, "api");
}

async function fetchGithubLatestFromFeed() {
	const xml = await fetchText(GITHUB_RELEASES_FEED_URL);
	const candidates = xml.split("<entry>").slice(1).map((block) => block.split("</entry>")[0]).map((block) => {
		const version = parseVersion(readAtomTag(block, "title"));
		const type = version === null ? null : classifyRelease(version);
		const linkMatch = block.match(/<link\b[^>]*href="([^"]+)"/i);
		return version === null || type === null ? null : { version, type, tagName: "dsh-v" + version, publishedAt: readAtomTag(block, "updated"), url: linkMatch?.[1] ?? "", prerelease: type !== "release" };
	}).filter((item) => item !== null && item.publishedAt !== null);
	const item = candidates.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))[0];
	if (item === undefined) throw new Error("no published GitHub feed release");
	return createGithubResult(item.version, item.type, item.tagName, item.publishedAt, item.url, item.prerelease, "atom");
}

async function fetchGithubLatest() {
	try {
		return await fetchGithubLatestFromApi();
	} catch (apiError) {
		try {
			return await fetchGithubLatestFromFeed();
		} catch {
			throw new Error(apiError?.status === 403 ? "github-rate-limit" : "github-unavailable");
		}
	}
}

async function fetchVersionCheck() {
	const [npm, github] = await Promise.allSettled([fetchNpmLatest(), fetchGithubLatest()]);
	return {
		current: resolveDshVersion(),
		installInfo: resolveInstallInfo(),
		npm: npm.status === "fulfilled" ? { status: "success", ...npm.value } : { status: "error" },
		github: github.status === "fulfilled" ? { status: "success", ...github.value } : { status: "error", reason: github.reason?.message === "github-rate-limit" ? "rate-limit" : "unavailable" },
		checkedAt: Date.now()
	};
}

function getVersionCheck(force = false) {
	if (!force && versionCheckCache !== undefined && Date.now() - versionCheckCache.checkedAt < CHECK_CACHE_TTL_MS) return Promise.resolve(versionCheckCache);
	if (versionCheckPromise !== undefined) return versionCheckPromise;
	versionCheckPromise = fetchVersionCheck().then((result) => {
		versionCheckCache = result;
		return result;
	}).finally(() => {
		versionCheckPromise = undefined;
	});
	return versionCheckPromise;
}

function updateCommand(method, version) {
	const packageSpec = "@deepseek-ai/dsh@" + version;
	const command = method === "npm"
		? { executable: "npm", args: ["install", "--global", packageSpec] }
		: method === "pnpm"
			? { executable: "pnpm", args: ["add", "--global", packageSpec] }
			: undefined;
	if (command === undefined) return undefined;
	const text = [command.executable, ...command.args].join(" ");
	if (process.platform !== "win32") return { ...command, text };
	return {
		executable: process.env.ComSpec ?? "cmd.exe",
		args: ["/d", "/s", "/c", text],
		text
	};
}

function appendUpdateOutput(job, chunk) {
	const text = String(chunk).replaceAll("\r", "");
	if (text === "") return;
	job.output = (job.output + text).split("\n").slice(-200).join("\n");
	if (job.output.length > 20000) job.output = job.output.slice(-20000);
	job.lines = job.output.split("\n");
	// ponytail: cap update logs at 200 lines/20k chars; persistent log storage is unnecessary for this UI.
}

function startUpdate(command, source, version, method) {
	if (updateJob?.status === "running") return updateJob;
	const job = {
		id: randomBytes(12).toString("hex"),
		status: "running",
		source,
		version,
		method,
		command: command.text,
		lines: [],
		output: "",
		startedAt: Date.now(),
		restartRequired: true
	};
	updateJob = job;
	const child = spawn(command.executable, command.args, { stdio: ["ignore", "pipe", "pipe"], windowsHide: true, shell: false });
	child.stdout?.setEncoding("utf8");
	child.stderr?.setEncoding("utf8");
	child.stdout?.on("data", (chunk) => appendUpdateOutput(job, chunk));
	child.stderr?.on("data", (chunk) => appendUpdateOutput(job, chunk));
	let settled = false;
	const finish = (result) => {
		if (settled) return;
		settled = true;
		clearTimeout(timer);
		Object.assign(job, result, { finishedAt: Date.now() });
		delete job.output;
	};
	const timer = setTimeout(() => { child.kill(); finish({ status: "error", reason: "timeout" }); }, UPDATE_TIMEOUT_MS);
	child.once("error", () => finish({ status: "error", reason: "spawn-failed" }));
	child.once("close", (code) => finish(code === 0 ? { status: "success" } : { status: "error", reason: "command-failed", exitCode: code }));
	return job;
}

function readJsonBody(req) {
	return new Promise((resolve, reject) => {
		let body = "";
		let settled = false;
		req.setEncoding("utf8");
		req.on("data", (chunk) => {
			if (settled) return;
			body += chunk;
			if (body.length > 8192) {
				settled = true;
				reject(new Error("request too large"));
			}
		});
		req.on("end", () => {
			if (settled) return;
			try {
				settled = true;
				resolve(body === "" ? {} : JSON.parse(body));
			} catch {
				settled = true;
				reject(new Error("invalid json"));
			}
		});
		req.on("error", (error) => { if (!settled) { settled = true; reject(error); } });
	});
}

function serializeUpdateJob() {
	if (updateJob === undefined) return { status: "idle" };
	return { ...updateJob, output: undefined };
}

function registerRoutes(ctx) {
	ctx.effect(() => ctx.webServer.register({
		kind: "exact",
		path: CHECK_ROUTE,
		handler: async (req, res) => {
			if (req.method !== "GET" || !isAuthorized(req)) {
				writeJson(res, req.method === "GET" ? 403 : 405, { ok: false, reason: "not-allowed" });
				return;
			}
			const force = new URL(req.url ?? CHECK_ROUTE, "http://localhost").searchParams.get("force") === "1";
			try {
				writeJson(res, 200, { ok: true, ...(await getVersionCheck(force)) });
			} catch {
				writeJson(res, 502, { ok: false, reason: "check-failed" });
			}
		}
	}), "dsh-sm-version-display: check route");

	ctx.effect(() => ctx.webServer.register({
		kind: "exact",
		path: UPDATE_STATUS_ROUTE,
		handler: (req, res) => {
			if (req.method !== "GET" || !isAuthorized(req)) {
				writeJson(res, req.method === "GET" ? 403 : 405, { ok: false, reason: "not-allowed" });
				return;
			}
			writeJson(res, 200, { ok: true, job: serializeUpdateJob() });
		}
	}), "dsh-sm-version-display: update status route");

	ctx.effect(() => ctx.webServer.register({
		kind: "exact",
		path: UPDATE_ROUTE,
		handler: async (req, res) => {
			if (req.method !== "POST" || !isAuthorized(req)) {
				writeJson(res, req.method === "POST" ? 403 : 405, { ok: false, reason: "not-allowed" });
				return;
			}
			if (updateJob?.status === "running") {
				writeJson(res, 409, { ok: false, reason: "already-running", job: serializeUpdateJob() });
				return;
			}
			let body;
			try {
				body = await readJsonBody(req);
			} catch {
				writeJson(res, 400, { ok: false, reason: "invalid-request" });
				return;
			}
			const source = body?.source === "github" ? "github" : body?.source === "npm" ? "npm" : null;
			const version = parseVersion(body?.version);
			if (source === null || version === null) {
				writeJson(res, 400, { ok: false, reason: "invalid-target" });
				return;
			}
			const result = await getVersionCheck(false);
			const target = result[source];
			const info = resolveInstallInfo();
			const command = updateCommand(info.method, version);
			if (target?.status !== "success" || target.version !== version) {
				writeJson(res, 409, { ok: false, reason: "stale-target" });
				return;
			}
			if (source === "github" && target.npmAvailable !== true) {
				writeJson(res, 409, { ok: false, reason: "manual-only", source, version });
				return;
			}
			if (command === undefined || !info.canOneClick) {
				writeJson(res, 409, { ok: false, reason: "manual-only", method: info.method });
				return;
			}
			const job = startUpdate(command, source, version, info.method);
			writeJson(res, 202, { ok: true, job: serializeUpdateJob() });
		}
	}), "dsh-sm-version-display: update route");
}

function apply(ctx) {
	ctx.inject(["settings"], (settingsCtx) => {
		settingsCtx.settings.register(settingsNamespace(SETTINGS_NAMESPACE), SettingsSchema, { applies: "live" });
	});
	registerRoutes(ctx);
	ctx.on("webserver/index-inject", (table) => {
		table.push({ kind: "global", name: "__DSH_VERSION__", value: resolveDshVersion() });
		table.push({ kind: "global", name: "__DSH_INSTALL_INFO__", value: resolveInstallInfo() });
		table.push({ kind: "global", name: "__DSH_UPDATE_TOKEN__", value: UPDATE_TOKEN });
	});
}

export { apply, inject, name };
