// dsh-sm-version-display — host half.
//
// Publishes the installed DeepSeek Harness version and provides cached,
// loopback-only version/update APIs for the Web client.
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { basename, dirname, join, resolve } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import z from "@deepseek-ai/schemastery";
import { backupDirectories, browseDirectories, deleteBackups, isBackupComplete, listBackups, rememberBackupDirectory, validateBackupDirectory } from './backup-manager.mjs';

/** Stable cordis plugin name. */
const name = "dsh-sm-version-display";

/** Services required before the injection row can be contributed. */
const inject = ["webServer"];

const require = createRequire(import.meta.url);

/** Candidate package manifests whose version tracks the harness version. */
const VERSION_CANDIDATES = [
	"@deepseek-ai/dsh/package.json",
	"@deepseek-ai/dsh-web-app/package.json"
];

const CHECK_ROUTE = "/api/dsh-sm-version-display/check";
const UPDATE_ROUTE = "/api/dsh-sm-version-display/update";
const UPDATE_STATUS_ROUTE = "/api/dsh-sm-version-display/update/status";
const UPDATE_ACTION_ROUTE = "/api/dsh-sm-version-display/update/action";
const UPDATE_TOKEN = randomBytes(32).toString("hex");
const NPM_LATEST_URL = "https://registry.npmjs.org/@deepseek-ai%2Fdsh/latest";
const NPM_PACKAGE_URL = "https://registry.npmjs.org/@deepseek-ai%2Fdsh";
const GITHUB_RELEASES_URL = "https://api.github.com/repos/deepseek-ai/deepseek-harness/releases?per_page=30";
const GITHUB_RELEASES_FEED_URL = "https://github.com/deepseek-ai/deepseek-harness/releases.atom";
const CHECK_TIMEOUT_MS = 10000;
const CHECK_CACHE_TTL_MS = 5 * 60 * 1000;
const UPDATE_STATE_FILE = join(process.env.LOCALAPPDATA ?? join(homedir(), "AppData", "Local"), "dsh-sm-version-display", "update-state.json");
const UPDATE_WORKER = fileURLToPath(new URL("./update-worker.mjs", import.meta.url));
const UPDATE_STALE_MS = 45 * 60 * 1000;
const HEARTBEAT_TIMEOUT_MS = 10 * 60 * 1000;
const STATE_WRITE_RETRIES = 5;
const STATE_RETRY_DELAY_MS = 50;
let versionCheckCache;
let versionCheckPromise;
let updateJob;
let mutationPending = false;

function failureActions(state) {
	if (state.reason === 'offline-repair-failed' || state.reason === 'rollback-failed') return [];
	const actions = isBackupComplete(state.backup, state.id) ? ['repair', 'rollback'] : state.backupOptions?.enabled === false ? ['repair'] : ['retry-backup'];
	if (isUpdateTargetInstalled(state)) actions.unshift('verify');
	return actions;
}

function isUpdateTargetInstalled(state) {
	try {
		const pkg = JSON.parse(readFileSync(join(state.globalRoot, "node_modules", "@deepseek-ai", "dsh", "package.json"), "utf8"));
		return pkg.name === "@deepseek-ai/dsh" && pkg.version === state.version;
	} catch {
		return false;
	}
}

function currentState() {
	const state = readUpdateState();
	if ((state?.status === "restart-required" || (state?.status === "success" && state.stage === "restart-required")) && state.restartRequired === true && DSH_PROCESS_STARTED_AT > (state.finishedAt ?? 0) && DSH_PROCESS_VERSION === state.version && isUpdateTargetInstalled(state)) {
		state.status = "success";
		state.stage = "verification-complete";
		state.action = "verify";
		state.restartRequired = false;
		state.actions = [];
		state.verificationHostStartedAt = DSH_PROCESS_STARTED_AT;
		state.verificationHostVersion = DSH_PROCESS_VERSION;
		state.finishedAt = Date.now();
		writeUpdateState(state);
	}
	if (state?.status === 'running' && ((state.workerPid && !isProcessAlive(state.workerPid)) || (!state.workerPid && Date.now() - state.startedAt > 30000))) {
		state.status = 'error'; state.stage = 'failed'; state.reason = 'worker-exited'; state.error = 'update worker is no longer running';
		if (state.backup?.status === 'running') state.backup = { ...state.backup, status: 'failed', finishedAt: Date.now() };
		for (const step of state.steps ?? []) if (step.status === 'running') step.status = 'error';
		state.actions = failureActions(state); writeUpdateState(state);
	}
	return state;
}

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
	const launcherPackage = resolveDshPackageFromLauncher(process.argv[1]);
	if (launcherPackage !== undefined) return launcherPackage;
	for (const spec of VERSION_CANDIDATES) {
		try {
			const pkgPath = require.resolve(spec);
			const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
			if (typeof pkg.version === "string" && pkg.version !== "") return { pkgPath, version: pkg.version };
		} catch {
			// try the next candidate
		}
	}
	return resolveDshPackageFromLauncher(process.argv[1]);
}

function resolveDshPackageFromLauncher(launcherPath, versionCandidates = VERSION_CANDIDATES) {
	if (typeof launcherPath !== "string" || launcherPath === "") return undefined;
	launcherPath = resolve(launcherPath);
	const candidates = new Set(versionCandidates.map((spec) => spec.slice(0, -"/package.json".length)));
	for (let current = dirname(launcherPath), depth = 0; depth < 8; current = dirname(current), depth++) {
		try {
			const pkgPath = join(current, "package.json");
			const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
			if (candidates.has(pkg.name) && typeof pkg.version === "string" && pkg.version !== "") return { pkgPath, version: pkg.version };
		} catch {
			// Keep walking from the DSH launcher to its package root.
		}
	}
	return undefined;
}

/** Classify the local DSH launcher without exposing its resolved path. */
function resolveInstallInfo() {
	const resolved = resolveDshPackage();
	const path = resolved?.pkgPath?.replaceAll("\\", "/") ?? "";
	const globalRoot = resolveGlobalRoot();
	const method = classifyDshInstall(path, resolveVirtualStoreDir() !== undefined, globalRoot);
	return {
		method,
		profilePackageManager: "pnpm",
		canOneClick: (method === "npm" || method === "pnpm") && globalRoot !== undefined
	};
}

function normalizedInstallPath(path) {
	const value = String(path).replaceAll("\\", "/");
	const normalized = /^[A-Za-z]:\//.test(value) || value.startsWith("//") ? value : resolve(value).replaceAll("\\", "/");
	return (process.platform === "win32" || /^[A-Za-z]:\//.test(normalized) || normalized.startsWith("//") ? normalized.toLowerCase() : normalized).replace(/\/$/, "");
}

function pathIsUnder(parent, child) {
	return child === parent || child.startsWith(parent + "/");
}

function pathEntries(env) {
	return String(env.PATH ?? "").split(process.platform === "win32" ? ";" : ":").filter(Boolean);
}

function pnpmGlobalRoot(root, env) {
	if (typeof root !== "string") return false;
	if (env.PNPM_HOME && pathIsUnder(normalizedInstallPath(join(env.PNPM_HOME, "global")), normalizedInstallPath(root))) return true;
	const rootPath = normalizedInstallPath(root);
	for (const binDirectory of pathEntries(env)) {
		if (normalizedInstallPath(binDirectory) === rootPath) return true;
		for (const extension of [".cmd", ".ps1", ""]) {
			try {
				const shim = readFileSync(join(binDirectory, "dsh" + extension), "utf8");
				if (normalizedInstallPath(shim).includes(rootPath)) return true;
			} catch {
				// This PATH entry does not contain a readable DSH launcher.
			}
		}
	}
	return false;
}

function npmGlobalRoot(root, env) {
	if (typeof root !== "string") return false;
	const candidate = normalizedInstallPath(root);
	const knownRoots = [env.npm_config_prefix, env.APPDATA ? join(env.APPDATA, "npm") : undefined, ...pathEntries(env)];
	return knownRoots.some((knownRoot) => typeof knownRoot === "string" && normalizedInstallPath(knownRoot) === candidate);
}

function classifyDshInstall(path, hasPnpmStore = false, globalRoot, env = process.env) {
	if (/_npx(?:\/|$)/i.test(path) || /npm-cache.*_npx/i.test(path)) return "npx";
	if (hasPnpmStore || /(?:^|\/)\.pnpm(?:\/|$)/i.test(path) || /(?:^|\/)pnpm(?:\/|$)/i.test(path)) return pnpmGlobalRoot(globalRoot, env) ? "pnpm" : "unknown";
	if (/(?:^|\/)node_modules\/@deepseek-ai\/(?:dsh|dsh-web-app)\/package\.json$/i.test(path)) return npmGlobalRoot(globalRoot, env) ? "npm" : "unknown";
	return "unknown";
}

function parseVirtualStoreDir(metadata) {
	try {
		const value = JSON.parse(metadata).virtualStoreDir;
		if (typeof value === "string") return value;
	} catch {
		// Fall back to the line-oriented format used by older pnpm versions.
	}
	const match = metadata.match(/"?virtualStoreDir"?\s*:\s*(?:"((?:\\.|[^"])*)"|'([^']*)'|([^\s,}]+))/);
	if (match === null) return undefined;
	const value = match[1] === undefined
		? match[2] === undefined ? match[3] : match[2].replaceAll("\\\\", "\\")
		: JSON.parse('"' + match[1] + '"');
	return /^(?:[A-Za-z]:[\\/]|\\\\|\/)/.test(value) && !/[\r\n"]/.test(value) ? value : undefined;
}

function resolveVirtualStoreDir() {
	const resolved = resolveDshPackage();
	let current = resolved?.pkgPath === undefined ? undefined : dirname(resolved.pkgPath);
	for (let depth = 0; current !== undefined && depth < 10; depth++, current = dirname(current)) {
		try {
			const metadata = readFileSync(join(current, "node_modules", ".modules.yaml"), "utf8");
			const value = parseVirtualStoreDir(metadata);
			if (value !== undefined) return value;
		} catch {
			// Keep looking through the resolved package's parent directories.
		}
	}
	return undefined;
}

function needsPnpmGlobalRepair() {
	const virtualStoreDir = resolveVirtualStoreDir();
	if (virtualStoreDir === undefined) return false;
	const parent = dirname(virtualStoreDir);
	if (basename(parent).toLowerCase() !== "node_modules") return false;
	const expected = join(dirname(parent), ".pnpm");
	return virtualStoreDir.replaceAll("\\", "/").toLowerCase() !== expected.replaceAll("\\", "/").toLowerCase();
}

function resolveGlobalRoot() {
	const virtualStoreDir = resolveVirtualStoreDir();
	if (virtualStoreDir !== undefined) {
		const parent = dirname(virtualStoreDir);
		if (basename(parent).toLowerCase() === "node_modules") return dirname(parent);
	}
	const resolved = resolveDshPackage();
	const npmRoot = resolveGlobalRootFromPackage(resolved?.pkgPath);
	if (npmRoot !== undefined) return npmRoot;
	let current = resolved?.pkgPath === undefined ? undefined : dirname(resolved.pkgPath);
	for (let depth = 0; current !== undefined && depth < 10; depth++, current = dirname(current)) {
		if (existsSync(join(current, "package.json")) && existsSync(join(current, "pnpm-lock.yaml")) && existsSync(join(current, "node_modules"))) return current;
	}
	return undefined;
}

function resolveGlobalRootFromPackage(pkgPath) {
	if (typeof pkgPath !== "string" || /(?:^|[\\/])\.pnpm(?:[\\/]|$)/i.test(pkgPath)) return undefined;
	const packageDir = dirname(pkgPath);
	const scopeDir = dirname(packageDir);
	const modulesDir = dirname(scopeDir);
	if (basename(scopeDir).toLowerCase() !== "@deepseek-ai" || basename(modulesDir).toLowerCase() !== "node_modules") return undefined;
	return dirname(modulesDir);
}

function resolveDshHome() {
	return process.env.DSH_HOME ?? join(homedir(), ".dsh");
}

const DSH_PROCESS_STARTED_AT = Date.now();
const DSH_PROCESS_VERSION = resolveDshVersion();

function readUpdateState() {
	try {
		return JSON.parse(readFileSync(UPDATE_STATE_FILE, "utf8"));
	} catch {
		return undefined;
	}
}

function writeUpdateState(state) {
	mkdirSync(dirname(UPDATE_STATE_FILE), { recursive: true });
	const temporary = UPDATE_STATE_FILE + "." + process.pid + "-" + randomBytes(8).toString("hex") + ".tmp";
	try {
		writeFileSync(temporary, JSON.stringify(state), "utf8");
		for (let attempt = 0; ; attempt++) {
			try {
				renameSync(temporary, UPDATE_STATE_FILE);
				return;
			} catch (error) {
				if (!["EPERM", "EACCES", "EBUSY"].includes(error?.code) || attempt >= STATE_WRITE_RETRIES) throw error;
				Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, STATE_RETRY_DELAY_MS);
			}
		}
	} finally {
		try { rmSync(temporary, { force: true }); } catch { /* best-effort cleanup after a failed rename */ }
	}
}

function formatCommandArg(arg) {
	return /[\s&"]/.test(arg) ? '"' + arg + '"' : arg;
}

export const Config = z.object({
	language: z.union([z.const("zh"), z.const("en"), z.const("zh-TW")]).default("zh").volatile(),
	enabled: z.boolean().default(true).volatile()
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

function updateCommand(method, version, globalRoot) {
	const packageSpec = "@deepseek-ai/dsh@" + version;
	const update = method === "npm"
		? { executable: "npm", args: ["install", "--global", ...(globalRoot ? ["--prefix", globalRoot] : []), packageSpec] }
		: method === "pnpm"
			? { executable: "pnpm", args: ["add", "--global", packageSpec] }
			: undefined;
	if (update === undefined) return undefined;
	const commands = method === "pnpm" && needsPnpmGlobalRepair()
		? [
			{ executable: "pnpm", args: ["install", "--global", "--force"] },
			update
		]
		: [update];
	return { commands, text: commands.map((command) => [command.executable, ...command.args.map(formatCommandArg)].join(" ")).join(" && ") };
}

function startUpdate(command, source, version, method, backupOptions) {
	const previous = readUpdateState();
	if (previous?.status === "running" && Date.now() - (previous.startedAt ?? Date.now()) < UPDATE_STALE_MS) return previous;
	if (previous?.status === "running") writeUpdateState({ ...previous, status: "error", stage: "failed", reason: "stale-job", error: "previous update task stopped unexpectedly", actions: previous.backup?.status === "complete" ? ["repair", "rollback"] : [] });
	const job = {
		id: randomBytes(12).toString("hex"),
		status: "running",
		stage: "preparing",
		source,
		version,
		previousVersion: resolveDshVersion(),
		hostPid: process.pid,
		method,
		backupOptions,
		command: command.text,
		commands: command.commands,
		steps: [
			{ id: "backup", status: "pending", label: "settings.step.backup" },
			{ id: "preflight", status: "pending", label: "settings.step.preflight" },
			{ id: "repair", status: command.commands.length > 1 ? "pending" : "skipped", label: "settings.step.repair" },
			{ id: "install", status: "pending", label: "settings.step.install" },
			{ id: "profile-repair", status: "pending", label: "settings.step.profileRepair" },
			{ id: "verify", status: "pending", label: "settings.step.verify" }
		],
		backup: null,
		lines: [],
		startedAt: Date.now(),
		restartRequired: true,
		actions: [],
		globalRoot: resolveGlobalRoot(),
		profileRoot: join(resolveDshHome(), "profiles", "web")
	};
	updateJob = job;
	writeUpdateState(job);
	const child = spawn(process.execPath, [UPDATE_WORKER, "--state", UPDATE_STATE_FILE], { stdio: "ignore", windowsHide: true, detached: true, shell: false });
	job.workerPid = child.pid;
	const spawnedState = readUpdateState();
	if (spawnedState?.id === job.id && spawnedState.status === 'running') writeUpdateState({ ...spawnedState, workerPid: child.pid });
	child.once("error", (error) => {
		const current = readUpdateState();
		if (current?.id !== job.id) return;
		writeUpdateState({ ...current, status: "error", stage: "failed", reason: "worker-spawn-failed", error: error.message, actions: current.backup?.status === "complete" ? ["repair", "rollback"] : [] });
	});
	child.once("exit", (code) => {
		const current = readUpdateState();
		if (code === 0 || current?.id !== job.id || current.status !== "running") return;
		writeUpdateState({ ...current, status: "error", stage: "failed", reason: "worker-exited", error: "update worker exited with code " + code, actions: current.backup?.status === "complete" ? ["repair", "rollback"] : [] });
	});
	child.unref();
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
	const state = currentState() ?? updateJob;
	if (state === undefined) return { status: "idle" };
	if (state.status === "success" && state.restartRequired === false) return { status: "idle" };
	const { globalRoot, profileRoot, commands, ...publicState } = state;
	const heartbeatExpired = publicState.status === "running" && Date.now() >= (publicState.heartbeatOverrideUntil ?? 0) && Date.now() - (publicState.lastActivityAt ?? publicState.startedAt ?? Date.now()) >= HEARTBEAT_TIMEOUT_MS;
	return { ...publicState, heartbeatExpired, actions: heartbeatExpired ? ['wait'] : state.status === 'error' ? failureActions(state) : publicState.actions, commands };
}

function isProcessAlive(pid) {
	if (!Number.isInteger(pid) || pid <= 0) return false;
	try {
		process.kill(pid, 0);
		return true;
	} catch {
		return false;
	}
}

function registerRoutes(ctx) {
	for (const [suffix, method, operation] of [
		['', 'GET', () => listBackups(dirname(UPDATE_STATE_FILE), currentState())],
		['/directories', 'GET', (body, req) => browseDirectories(new URL(req.url, 'http://localhost').searchParams.get('path') || homedir())],
		['/scan', 'POST', body => { const directory = validateBackupDirectory(body.directory, [resolveGlobalRoot(), resolveVirtualStoreDir(), resolveDshHome()]); rememberBackupDirectory(dirname(UPDATE_STATE_FILE), directory); return listBackups(dirname(UPDATE_STATE_FILE), currentState()); }],
		['/delete', 'POST', body => deleteBackups(dirname(UPDATE_STATE_FILE), body.ids, currentState())]
	]) {
		ctx.effect(() => ctx.webServer.register({ kind: 'exact', path: '/api/dsh-sm-version-display/backups' + suffix, handler: async (req, res) => {
			if (req.method !== method || !isAuthorized(req)) return writeJson(res, req.method === method ? 403 : 405, { ok: false, reason: 'not-allowed' });
			let locked = false;
			try {
				const body = method === 'POST' ? await readJsonBody(req) : {};
				if (method === 'POST') { if (mutationPending || currentState()?.status === 'running') return writeJson(res, 409, { ok: false, reason: 'already-running' }); mutationPending = true; locked = true; }
				writeJson(res, 200, { ok: true, ...await operation(body, req) });
			} catch (error) { writeJson(res, 400, { ok: false, reason: error.message }); }
			finally { if (locked) mutationPending = false; }
		} }), 'dsh-sm-version-display: backups' + suffix);
	}
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
			if (mutationPending || currentState()?.status === "running") {
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
			if (mutationPending || currentState()?.status === 'running') return writeJson(res, 409, { ok: false, reason: 'already-running' });
			mutationPending = true;
			try {
			const options = body.backupOptions ?? { enabled: true };
			if (typeof options.enabled !== 'boolean') return writeJson(res, 400, { ok: false, reason: 'invalid-backup-options' });
			const backupOptions = { enabled: options.enabled };
			if (options.enabled) {
				backupOptions.directory = validateBackupDirectory(options.directory || backupDirectories(dirname(UPDATE_STATE_FILE)).directory, [resolveGlobalRoot(), resolveVirtualStoreDir(), resolveDshHome()]);
				rememberBackupDirectory(dirname(UPDATE_STATE_FILE), backupOptions.directory);
			}
			const result = await getVersionCheck(false);
			const target = result[source];
			const info = resolveInstallInfo();
			const command = updateCommand(info.method, version, resolveGlobalRoot());
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
			startUpdate(command, source, version, info.method, backupOptions);
			writeJson(res, 202, { ok: true, job: serializeUpdateJob() });
			} catch (error) { writeJson(res, 400, { ok: false, reason: error.message }); }
			finally { mutationPending = false; }
		}
	}), "dsh-sm-version-display: update route");

	ctx.effect(() => ctx.webServer.register({
		kind: "exact",
		path: UPDATE_ACTION_ROUTE,
		handler: async (req, res) => {
			if (req.method !== "POST" || !isAuthorized(req)) {
				writeJson(res, req.method === "POST" ? 403 : 405, { ok: false, reason: "not-allowed" });
				return;
			}
			let body;
			try {
				body = await readJsonBody(req);
			} catch {
				writeJson(res, 400, { ok: false, reason: "invalid-request" });
				return;
			}
			const state = currentState();
			const heartbeatExpired = state?.status === "running" && Date.now() - (state.lastActivityAt ?? state.startedAt ?? Date.now()) >= HEARTBEAT_TIMEOUT_MS;
			if (mutationPending || state === undefined || (state.status !== "error" && state.status !== "restart-required" && !heartbeatExpired)) return writeJson(res, 409, { ok: false, reason: 'no-failed-update', job: serializeUpdateJob() });
			if (body?.jobId !== state.id || !["wait", "verify", "repair", "rollback", "retry-backup"].includes(body?.action) || (body.action === "wait" && !heartbeatExpired)) {
				writeJson(res, 400, { ok: false, reason: "invalid-action" });
				return;
			}
			const action = body.action;
			if (action === "rollback" && !isBackupComplete(state.backup, state.id)) {
				writeJson(res, 409, { ok: false, reason: "backup-incomplete", job: serializeUpdateJob() });
				return;
			}
			if (action === "wait") {
				const next = { ...state, heartbeatOverrideUntil: Date.now() + HEARTBEAT_TIMEOUT_MS, heartbeatExpired: false, actions: [] };
				writeUpdateState(next);
				updateJob = next;
				writeJson(res, 202, { ok: true, job: serializeUpdateJob() });
				return;
			}
			if (mutationPending || isProcessAlive(state.workerPid) || currentState()?.status === 'running') return writeJson(res, 409, { ok: false, reason: 'already-running' });
			if (!(state.status === 'restart-required' ? action === 'verify' : failureActions(state).includes(action))) return writeJson(res, 409, { ok: false, reason: 'invalid-action' });
			const next = { ...state, startedAt: Date.now(), workerPid: null, status: "running", stage: action === "rollback" ? "rolling-back" : action === "verify" ? "verifying" : "repairing", action, verificationHostStartedAt: action === "verify" ? DSH_PROCESS_STARTED_AT : undefined, verificationHostVersion: action === "verify" ? DSH_PROCESS_VERSION : undefined, actions: [], error: null, backup: action === "retry-backup" ? null : state.backup, lines: [...(state.lines ?? []), "[action] " + action] };
			writeUpdateState(next);
			updateJob = next;
			const child = spawn(process.execPath, [UPDATE_WORKER, "--state", UPDATE_STATE_FILE, "--action", action], { stdio: "ignore", windowsHide: true, detached: true, shell: false });
			const spawnedState = readUpdateState();
			if (spawnedState?.id === state.id && spawnedState.status === 'running') writeUpdateState({ ...spawnedState, workerPid: child.pid });
			child.once("error", (error) => { const current = readUpdateState(); writeUpdateState({ ...current, status: "error", stage: "failed", reason: "worker-spawn-failed", error: error.message, actions: current?.backup?.status === "complete" ? ["repair", "rollback"] : [] }); });
			child.once("exit", (code) => { const current = readUpdateState(); if (code === 0 || current?.id !== state.id || current.status !== "running") return; writeUpdateState({ ...current, status: "error", stage: "failed", reason: "worker-exited", error: "update worker exited with code " + code, actions: current?.backup?.status === "complete" ? ["repair", "rollback"] : [] }); });
			child.unref();
			writeJson(res, 202, { ok: true, job: serializeUpdateJob() });
		}
	}), "dsh-sm-version-display: update action route");
}

function apply(ctx) {
	ctx.inject(["settings"], (settingsCtx) => {
		settingsCtx.effect(() => settingsCtx.settings.configure({ auto: false }), "dsh-sm-version-display: settings page");
	});
	registerRoutes(ctx);
	ctx.on("webserver/index-inject", (table) => {
		table.push({ kind: "global", name: "__DSH_VERSION__", value: resolveDshVersion() });
		table.push({ kind: "global", name: "__DSH_INSTALL_INFO__", value: resolveInstallInfo() });
		table.push({ kind: "global", name: "__DSH_UPDATE_TOKEN__", value: UPDATE_TOKEN });
	});
}

export { apply, inject, name };
