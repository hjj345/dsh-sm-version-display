import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { copyFile, lstat, mkdir, readdir, readlink, stat, symlink } from "node:fs/promises";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { basename, dirname, join } from "node:path";
import { tmpdir } from "node:os";

const args = process.argv.slice(2);
const statePath = args[args.indexOf("--state") + 1];
const action = args[args.indexOf("--action") + 1] ?? "run";
const MAX_LINES = 200;
const COMMAND_TIMEOUT_MS = 10 * 60 * 1000;
const HEARTBEAT_TIMEOUT_MS = 10 * 60 * 1000;
const STATE_WRITE_RETRIES = 5;
const STATE_RETRY_DELAY_MS = 50;

if (args.includes("--self-test")) {
	const root = mkdtempSync(join(tmpdir(), "dsh-sm-version-display-worker-"));
	try {
		const globalRoot = join(root, "global");
		mkdirSync(join(globalRoot, "node_modules"), { recursive: true });
		writeFileSync(join(globalRoot, "node_modules", ".modules.yaml"), JSON.stringify({ virtualStoreDir: join(globalRoot, ".pnpm") }), "utf8");
		if (HEARTBEAT_TIMEOUT_MS !== 600000) throw new Error("heartbeat timeout self-test failed");
		if (stateTemporaryPath(join(root, "state.json")) === stateTemporaryPath(join(root, "state.json"))) throw new Error("state temp path self-test failed");
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
	state = { ...state, ...patch, lastActivityAt: Date.now() };
	const temporary = stateTemporaryPath(statePath);
	mkdirSync(dirname(statePath), { recursive: true });
	try {
		writeFileSync(temporary, JSON.stringify(state), "utf8");
		for (let attempt = 0; ; attempt++) {
			try {
				renameSync(temporary, statePath);
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

function stateTemporaryPath(path) {
	return path + "." + process.pid + "-" + randomBytes(8).toString("hex") + ".tmp";
}

function append(line) {
	const incoming = String(line).replaceAll("\r", "").split("\n");
	const lines = [...(state.lines ?? []), ...incoming].slice(-MAX_LINES);
	save({ lines });
}

function updateStep(id, status, extra = {}) {
	save({ steps: (state.steps ?? []).map((step) => step.id === id ? { ...step, status, ...extra } : step) });
}

save({ workerPid: process.pid });

function fail(reason, error) {
	const message = error?.message ?? String(error ?? reason);
	append("[error] " + message);
	const manual = /profile|dump-config|EADDRINUSE|running/i.test(message) ? { stopCommand: state.hostPid ? "taskkill /PID " + state.hostPid + " /T /F" : "先关闭正在运行的 DSH Web 服务", repairCommand: "pnpm install --dir \"" + state.profileRoot + "\"", note: "停止 DSH 后执行 profile 修复命令，再重新打开插件设置页。" } : null;
	save({ status: "error", stage: "failed", reason, error: message, manual, steps: (state.steps ?? []).map((step) => step.status === "running" ? { ...step, status: "error" } : step), actions: state.backup?.status === "complete" ? ["repair", "rollback"] : [], finishedAt: Date.now() });
}

async function scanTree(root, onProgress) {
	let files = 0;
	let bytes = 0;
	let lastProgressAt = 0;
	const visit = async (path) => {
		for (const entry of await readdir(path, { withFileTypes: true })) {
			const full = join(path, entry.name);
			if (entry.isSymbolicLink()) continue;
			if (entry.isDirectory()) await visit(full);
			else if (entry.isFile()) {
				files++;
				bytes += (await lstat(full)).size;
				if (Date.now() - lastProgressAt >= 250 || files === 1) { lastProgressAt = Date.now(); onProgress?.({ files, bytes, currentItem: full }); }
			}
		}
	};
	await visit(root);
	return { files, bytes };
}

async function copyTree(source, target, onProgress) {
	if (!existsSync(source)) throw new Error("backup source missing: " + source);
	let completedFiles = 0;
	let copiedBytes = 0;
	let lastProgressAt = 0;
	const copyNode = async (sourcePath, targetPath) => {
		const sourceStat = await lstat(sourcePath);
		if (sourceStat.isSymbolicLink()) {
			const targetStat = await stat(sourcePath);
			await symlink(await readlink(sourcePath), targetPath, targetStat.isDirectory() ? "junction" : "file");
			return;
		}
		if (sourceStat.isDirectory()) {
			await mkdir(targetPath, { recursive: false });
			for (const entry of await readdir(sourcePath, { withFileTypes: true })) await copyNode(join(sourcePath, entry.name), join(targetPath, entry.name));
			return;
		}
		await copyFile(sourcePath, targetPath);
		completedFiles++;
		copiedBytes += sourceStat.size;
		if (Date.now() - lastProgressAt >= 250 || completedFiles === 1) {
			lastProgressAt = Date.now();
			await onProgress({ completedFiles, copiedBytes, currentItem: sourcePath });
		}
	};
	await copyNode(source, target);
	return { files: completedFiles, bytes: copiedBytes };
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
	return [command.executable, ...command.args.map((arg) => /[\s&"]/.test(arg) ? '"' + arg + '"' : arg)].join(" ");
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
	save({ backup: { root: backupRoot, global: globalTarget, dsh: dshTarget, status: "running", phase: "scanning", createdAt: Date.now() } });
	const reportScan = (offsetFiles, offsetBytes, progress) => save({ backup: { ...state.backup, scannedFiles: offsetFiles + progress.files, scannedBytes: offsetBytes + progress.bytes, currentItem: progress.currentItem } });
	const globalSummary = await scanTree(state.globalRoot, (progress) => reportScan(0, 0, progress));
	const dshHome = dirname(dirname(state.profileRoot));
	const dshSummary = await scanTree(dshHome, (progress) => reportScan(globalSummary.files, globalSummary.bytes, progress));
	const totalFiles = globalSummary.files + dshSummary.files;
	const totalBytes = globalSummary.bytes + dshSummary.bytes;
	save({ backup: { ...state.backup, phase: "copying", totalFiles, totalBytes, completedFiles: 0, copiedBytes: 0, currentItem: "" } });
	const reportProgress = async (offsetFiles, offsetBytes, progress) => {
		const completedFiles = offsetFiles + progress.completedFiles;
		save({ backup: { ...state.backup, completedFiles, copiedBytes: offsetBytes + progress.copiedBytes, progress: totalFiles === 0 ? 100 : Math.floor(completedFiles * 100 / totalFiles), currentItem: progress.currentItem } });
	};
	await copyTree(state.globalRoot, globalTarget, (progress) => reportProgress(0, 0, progress));
	await copyTree(dshHome, dshTarget, (progress) => reportProgress(globalSummary.files, globalSummary.bytes, progress));
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

async function repairProfile() {
	updateStep("profile-repair", "running", { command: commandText({ executable: "pnpm", args: ["install", "--dir", state.profileRoot] }) });
	append("[profile] repairing " + state.profileRoot);
	const result = await runCommand({ executable: "pnpm", args: ["install", "--dir", state.profileRoot] });
	if (result.code !== 0) throw result.error ?? new Error("profile repair failed with exit code " + result.code);
	updateStep("profile-repair", "success", { exitCode: 0 });
}

async function verify() {
	save({ stage: "verifying" });
	updateStep("verify", "running");
	const actual = verifyInstalledVersion();
	if (actual !== state.version) throw new Error("installed DSH version is " + (actual ?? "unknown") + ", expected " + state.version);
	const virtualStoreDir = parseVirtualStoreDir(state.globalRoot);
	const expectedVirtualStoreDir = join(state.globalRoot, ".pnpm");
	if (virtualStoreDir !== undefined && virtualStoreDir.toLowerCase() !== expectedVirtualStoreDir.toLowerCase()) throw new Error("global virtual store is still " + virtualStoreDir);
	const profileFiles = ["package.json", "pnpm-lock.yaml", "cordis.patch.yml", "dsh.profile"].filter((file) => existsSync(join(state.profileRoot, file)));
	if (!existsSync(join(state.profileRoot, "package.json")) || profileFiles.length < 2) throw new Error("web profile is incomplete; expected package.json plus profile lock or patch metadata");
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
		if (action === "repair") await repairProfile();
		await preflight();
		await install();
		await verify();
		save({ status: "success", stage: "restart-required", actions: [], restartRequired: true, finishedAt: Date.now() });
	} catch (error) {
		fail("update-failed", error);
	}
}

function restoreTree(source, target, recoverySuffix) {
	if (!existsSync(source)) throw new Error("backup tree is missing: " + source);
	const recoveryRoot = target + recoverySuffix;
	if (existsSync(target)) renameSync(target, recoveryRoot);
	cpSync(source, target, { recursive: true, dereference: false, force: false, errorOnExist: true });
	return recoveryRoot;
}

async function rollback() {
	try {
		if (state.backup?.status !== "complete" || !state.backup.global) throw new Error("complete backup is unavailable");
		save({ stage: "rolling-back" });
		const recoverySuffix = ".recovery-" + state.id;
		const recoveryRoot = restoreTree(state.backup.global, state.globalRoot, recoverySuffix);
		const profileBackup = join(state.backup.dsh, "profiles", "web");
		const profileRecoveryRoot = existsSync(profileBackup) ? restoreTree(profileBackup, state.profileRoot, recoverySuffix) : undefined;
		const actual = verifyInstalledVersion();
		if (actual === undefined || (state.previousVersion !== "unknown" && actual !== state.previousVersion)) throw new Error("rollback restored " + (actual ?? "unknown") + ", expected " + state.previousVersion);
		append("[rollback] restored global DSH and web profile; recovery copies: " + [recoveryRoot, profileRecoveryRoot].filter(Boolean).join(", "));
		save({ status: "success", stage: "rollback-complete", actions: [], restartRequired: true, rollback: { verifiedVersion: actual, recoveryRoot, profileRecoveryRoot }, finishedAt: Date.now() });
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
