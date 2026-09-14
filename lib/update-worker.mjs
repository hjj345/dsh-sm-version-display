import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { basename, dirname, join } from "node:path";
import { tmpdir } from "node:os";

const args = process.argv.slice(2);
const statePath = args[args.indexOf("--state") + 1];
const action = args[args.indexOf("--action") + 1] ?? "run";
const MAX_LINES = 200;
const COMMAND_TIMEOUT_MS = 10 * 60 * 1000;

if (args.includes("--self-test")) {
	const root = mkdtempSync(join(tmpdir(), "dsh-sm-version-display-worker-"));
	try {
		const globalRoot = join(root, "global");
		mkdirSync(join(globalRoot, "node_modules"), { recursive: true });
		writeFileSync(join(globalRoot, "node_modules", ".modules.yaml"), JSON.stringify({ virtualStoreDir: join(globalRoot, ".pnpm") }), "utf8");
		if (parseVirtualStoreDir(globalRoot) !== join(globalRoot, ".pnpm")) throw new Error("virtual store parser self-test failed");
		if (commandText({ executable: "pnpm", args: ["add", "--global", "@deepseek-ai/dsh@0.1.5-rc.1"] }) !== "pnpm add --global @deepseek-ai/dsh@0.1.5-rc.1") throw new Error("command self-test failed");
		console.log("worker self-test passed");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
	process.exit(0);
}

if (!statePath) process.exit(2);

let state;
try {
	state = JSON.parse(readFileSync(statePath, "utf8"));
} catch {
	process.exit(3);
}

function save(patch) {
	state = { ...state, ...patch };
	const temporary = statePath + ".tmp";
	mkdirSync(dirname(statePath), { recursive: true });
	writeFileSync(temporary, JSON.stringify(state), "utf8");
	renameSync(temporary, statePath);
}

function append(line) {
	const lines = [...(state.lines ?? []), String(line)].slice(-MAX_LINES);
	save({ lines });
}

function updateStep(id, status, extra = {}) {
	save({ steps: (state.steps ?? []).map((step) => step.id === id ? { ...step, status, ...extra } : step) });
}

function fail(reason, error) {
	const message = error?.message ?? String(error ?? reason);
	append("[error] " + message);
	save({ status: "error", stage: "failed", reason, error: message, steps: (state.steps ?? []).map((step) => step.status === "running" ? { ...step, status: "error" } : step), actions: state.backup?.status === "complete" ? ["repair", "rollback"] : [], finishedAt: Date.now() });
}

function countTree(root) {
	let files = 0;
	let bytes = 0;
	const visit = (path) => {
		const entries = requireEntries(path);
		for (const entry of entries) {
			const full = join(path, entry.name);
			if (entry.isSymbolicLink()) continue;
			if (entry.isDirectory()) visit(full);
			else if (entry.isFile()) { files++; bytes += statSync(full).size; }
		}
	};
	visit(root);
	return { files, bytes };
}

function requireEntries(path) {
	try {
		return readdirSync(path, { withFileTypes: true });
	} catch {
		return [];
	}
}

function copyTree(source, target) {
	if (!existsSync(source)) throw new Error("backup source missing: " + source);
	cpSync(source, target, { recursive: true, dereference: false, force: false, errorOnExist: true });
	return countTree(target);
}

function parseVirtualStoreDir(root) {
	const file = join(root, "node_modules", ".modules.yaml");
	if (!existsSync(file)) return undefined;
	const metadata = readFileSync(file, "utf8");
	try {
		const value = JSON.parse(metadata).virtualStoreDir;
		return typeof value === "string" ? value : undefined;
	} catch {
		const match = metadata.match(/"?virtualStoreDir"?\s*:\s*"?([^"\r\n,}]+)"?/);
		return match?.[1]?.replaceAll("\\\\", "\\");
	}
}

function commandText(command) {
	return [command.executable, ...command.args].join(" ");
}

function runCommand(command, cwd) {
	return new Promise((resolve) => {
		let output = "";
		let settled = false;
		const text = commandText(command);
		const child = process.platform === "win32"
			? spawn(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", text], { cwd, windowsHide: true, stdio: ["ignore", "pipe", "pipe"], shell: false })
			: spawn(command.executable, command.args, { cwd, windowsHide: true, stdio: ["ignore", "pipe", "pipe"], shell: false });
		child.stdout?.setEncoding("utf8");
		child.stderr?.setEncoding("utf8");
		const collect = (chunk) => { output += String(chunk); append(chunk); };
		child.stdout?.on("data", collect);
		child.stderr?.on("data", collect);
		const finish = (result) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			resolve({ ...result, output });
		};
		const timer = setTimeout(() => { child.kill(); finish({ code: null, error: new Error("command timed out") }); }, COMMAND_TIMEOUT_MS);
		child.once("error", (error) => finish({ code: null, error }));
		child.once("close", (code) => finish({ code }));
	});
}

function verifyInstalledVersion() {
	const packagePath = join(state.globalRoot, "node_modules", "@deepseek-ai", "dsh", "package.json");
	try {
		return JSON.parse(readFileSync(packagePath, "utf8")).version;
	} catch {
		return undefined;
	}
}

async function backup() {
	updateStep("backup", "running");
	save({ stage: "backup" });
	const base = process.env.LOCALAPPDATA ?? join(process.env.USERPROFILE ?? process.cwd(), "AppData", "Local");
	const backupRoot = join(base, "dsh-sm-version-display", "backups", Date.now() + "-" + state.id);
	mkdirSync(backupRoot, { recursive: true });
	const globalTarget = join(backupRoot, "global");
	const dshTarget = join(backupRoot, "dsh");
	save({ backup: { root: backupRoot, global: globalTarget, dsh: dshTarget, status: "running", createdAt: Date.now() } });
	const globalSummary = copyTree(state.globalRoot, globalTarget);
	const dshHome = dirname(dirname(state.profileRoot));
	const dshSummary = copyTree(dshHome, dshTarget);
	const backupInfo = { root: backupRoot, global: globalTarget, dsh: dshTarget, files: globalSummary.files + dshSummary.files, bytes: globalSummary.bytes + dshSummary.bytes, status: "complete", createdAt: Date.now() };
	writeFileSync(join(backupRoot, "manifest.json"), JSON.stringify({ state: { id: state.id, version: state.version, globalRoot: state.globalRoot, profileRoot: state.profileRoot }, backup: backupInfo }, null, 2), "utf8");
	updateStep("backup", "success", { detail: backupInfo });
	save({ backup: backupInfo });
	append("[backup] created " + backupRoot + " (" + backupInfo.files + " files)");
}

async function preflight() {
	updateStep("preflight", "running");
	save({ stage: "preflight" });
	append("[preflight] checking exact npm target " + state.version);
	const result = await runCommand({ executable: "pnpm", args: ["view", "@deepseek-ai/dsh@" + state.version, "version", "--json"] });
	if (result.code !== 0) throw result.error ?? new Error("target package preflight failed");
	if (!result.output.includes(state.version)) throw new Error("pnpm returned an unexpected target version");
	updateStep("preflight", "success", { exitCode: 0 });
}

async function install() {
	save({ stage: "installing" });
	for (let index = 0; index < state.commands.length; index++) {
		const command = state.commands[index];
		const stepId = index === state.commands.length - 1 ? "install" : "repair";
		updateStep(stepId, "running", { command: commandText(command) });
		append("[step] " + stepId + ": " + commandText(command));
		const result = await runCommand(command);
		const peerWarnings = result.output.split(/\r?\n/).filter((line) => /unmet peer|issues with peer dependencies/i.test(line));
		if (peerWarnings.length > 0) save({ warnings: [...new Set([...(state.warnings ?? []), ...peerWarnings])].slice(-20) });
		if (result.code !== 0) {
			updateStep(stepId, "error", { exitCode: result.code });
			throw result.error ?? new Error(stepId + " failed with exit code " + result.code);
		}
		updateStep(stepId, "success", { exitCode: 0 });
	}
}

async function verify() {
	save({ stage: "verifying" });
	updateStep("verify", "running");
	const actual = verifyInstalledVersion();
	if (actual !== state.version) throw new Error("installed DSH version is " + (actual ?? "unknown") + ", expected " + state.version);
	const virtualStoreDir = parseVirtualStoreDir(state.globalRoot);
	const expectedVirtualStoreDir = join(state.globalRoot, ".pnpm");
	if (virtualStoreDir !== undefined && virtualStoreDir.toLowerCase() !== expectedVirtualStoreDir.toLowerCase()) throw new Error("global virtual store is still " + virtualStoreDir);
	if (!existsSync(join(state.profileRoot, "package.json")) || !existsSync(join(state.profileRoot, "dsh.profile"))) throw new Error("web profile is incomplete");
	const dshBin = join(state.globalRoot, "node_modules", "@deepseek-ai", "dsh", "lib", "bin.js");
	if (existsSync(dshBin)) {
		const result = await runCommand({ executable: process.execPath, args: [dshBin, "--profile", "web", "--dump-config"] }, dirname(dirname(state.profileRoot)));
		if (result.code !== 0) throw result.error ?? new Error("target DSH profile validation failed");
	}
	updateStep("verify", "success", { detail: { installedVersion: actual, virtualStoreDir, warnings: state.warnings ?? [] } });
	append("[verify] installed version " + actual + "; profile validation passed");
}

async function runUpdate() {
	try {
		if (state.backup === null || state.backup === undefined) await backup();
		await preflight();
		await install();
		await verify();
		save({ status: "success", stage: "restart-required", actions: [], restartRequired: true, finishedAt: Date.now() });
	} catch (error) {
		fail("update-failed", error);
	}
}

async function rollback() {
	try {
		if (state.backup?.status !== "complete" || !state.backup.global) throw new Error("complete backup is unavailable");
		save({ stage: "rolling-back" });
		const recoveryRoot = state.globalRoot + ".recovery-" + state.id;
		if (existsSync(state.globalRoot)) renameSync(state.globalRoot, recoveryRoot);
		cpSync(state.backup.global, state.globalRoot, { recursive: true, dereference: false, force: false, errorOnExist: true });
		const actual = verifyInstalledVersion();
		if (actual === undefined || (state.previousVersion !== "unknown" && actual !== state.previousVersion)) throw new Error("rollback restored " + (actual ?? "unknown") + ", expected " + state.previousVersion);
		append("[rollback] restored global DSH tree; recovery copy: " + recoveryRoot);
		save({ status: "success", stage: "rollback-complete", actions: [], restartRequired: true, rollback: { verifiedVersion: actual, recoveryRoot }, finishedAt: Date.now() });
	} catch (error) {
		fail("rollback-failed", error);
	}
}

async function main() {
	if (action === "rollback") return rollback();
	if (action === "repair") return runUpdate();
	return runUpdate();
}

void main();
