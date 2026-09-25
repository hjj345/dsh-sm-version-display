import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync, symlinkSync, readlinkSync } from "node:fs";
import assert from "node:assert/strict";
import { copyFile, lstat, mkdir, readdir, readlink, stat, symlink } from "node:fs/promises";
import { spawn, execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { registerBackup, isBackupComplete, validateBackupDirectory } from "./backup-manager.mjs";

const args = process.argv.slice(2);
let statePath = args.includes("--state") ? args[args.indexOf("--state") + 1] : undefined;
let state;
const action = args[args.indexOf("--action") + 1] ?? "run";
const MAX_LINES = 200;
const COMMAND_TIMEOUT_MS = 10 * 60 * 1000;
const HEARTBEAT_TIMEOUT_MS = 10 * 60 * 1000;
const STATE_WRITE_RETRIES = 5;
const STATE_RETRY_DELAY_MS = 50;
const PROFILE_PACKAGES = ["@deepseek-ai/dsh", "@deepseek-ai/dsh-settings", "@deepseek-ai/dsh-session-persistence", "@deepseek-ai/dsh-session-query"];
const SESSION_PACKAGES = PROFILE_PACKAGES.slice(2);

if (args.includes("--self-test")) {
	const root = mkdtempSync(join(tmpdir(), "dsh sm-version-display-worker-"));
	try {
		const globalRoot = join(root, "global");
		mkdirSync(join(globalRoot, "node_modules"), { recursive: true });
		writeFileSync(join(globalRoot, "node_modules", ".modules.yaml"), JSON.stringify({ virtualStoreDir: join(globalRoot, ".pnpm") }), "utf8");
		if (HEARTBEAT_TIMEOUT_MS !== 600000) throw new Error("heartbeat timeout self-test failed");
		if (stateTemporaryPath(join(root, "state.json")) === stateTemporaryPath(join(root, "state.json"))) throw new Error("state temp path self-test failed");
		if (parseVirtualStoreDir(globalRoot) !== join(globalRoot, ".pnpm")) throw new Error("virtual store parser self-test failed");
		if (commandText({ executable: "pnpm", args: ["add", "--global", "@deepseek-ai/dsh@0.1.5-rc.1"] }) !== "pnpm add --global @deepseek-ai/dsh@0.1.5-rc.1") throw new Error("command self-test failed");
		assert.equal(preflightCommand("npm", "0.0.2").executable, "npm");
		assert.equal(preflightCommand("pnpm", "0.0.2").executable, "pnpm");
		assert.deepEqual(globalRootCommand("npm", "C:\\Node Global"), { executable: "npm", args: ["root", "--global", "--prefix", "C:\\Node Global"] });
		assert.deepEqual(globalRootCommand("pnpm", "C:\\Users\\test\\pnpm\\global\\5"), { executable: "pnpm", args: ["root", "--global"] });
		assert.equal(packageManagerGlobalNodeModules(join(globalRoot, "node_modules")), join(globalRoot, "node_modules"));
		assert.throws(() => packageManagerGlobalNodeModules("relative\\node_modules"), /absolute global/);
		assert.equal(sameDirectory("C:\\node\\global", "c:/node/global/"), process.platform === "win32");
		assert.equal(verifyGlobalRoot(join(globalRoot, "node_modules"), globalRoot, "pnpm"), globalRoot);
		assert.throws(() => verifyGlobalRoot(join(root, "other", "node_modules"), globalRoot, "pnpm"), /refusing to update/);
		if (commandText({ executable: "C:\\Program Files\\nodejs\\node.exe", args: ["C:\\Users\\test user\\bin.js", "--profile", "web", "--dump-config"] }) !== '"C:\\Program Files\\nodejs\\node.exe" "C:\\Users\\test user\\bin.js" --profile web --dump-config') throw new Error("Windows executable quoting self-test failed");
		const missing = join(root, "missing-history");
		symlinkSync(missing, join(globalRoot, "node_modules.old"), "junction");
		const copied = join(root, "copied");
		const expected = await scanTree(globalRoot);
		assert.deepEqual(await copyTree(globalRoot, copied, () => {}), expected);
		assert.equal(readlinkSync(join(copied, "node_modules.old")), readlinkSync(join(globalRoot, "node_modules.old")));
		const restored = join(root, "restored");
		await restoreTree(copied, restored, ".recovery-test");
		assert.equal(readlinkSync(join(restored, "node_modules.old")), readlinkSync(join(globalRoot, "node_modules.old")));
		assert.equal(readFileSync(join(restored, "node_modules", ".modules.yaml"), "utf8"), readFileSync(join(globalRoot, "node_modules", ".modules.yaml"), "utf8"));
		const profileRoot = join(root, "home", "profiles", "web");
		mkdirSync(profileRoot, { recursive: true });
		const activePackage = join(globalRoot, "node_modules", "@deepseek-ai", "dsh");
		const activeBin = join(activePackage, "lib", "bin.js");
		mkdirSync(dirname(activeBin), { recursive: true });
		writeFileSync(join(activePackage, "package.json"), JSON.stringify({ name: "@deepseek-ai/dsh", version: "0.0.2", bin: { dsh: "lib/bin.js" } }));
		writeFileSync(activeBin, "process.exit(0);");
		statePath = join(root, "state", "update-state.json");
		state = { id: "self-test", version: "0.0.2", previousVersion: "0.0.1", globalRoot, profileRoot, steps: [{ id: "backup", status: "pending" }], backupOptions: { enabled: true, directory: join(root, "custom-backups") } };
		writeFileSync(join(dirname(profileRoot), "package.json"), JSON.stringify({ dependencies: Object.fromEntries(PROFILE_PACKAGES.map((name) => [name, state.version])) }));
		writeFileSync(join(profileRoot, "package.json"), JSON.stringify({ name: "dsh-profile-web", private: true, dependencies: { "@deepseek-ai/dsh-settings": state.version } }));
		for (const [directory, names] of [[dirname(profileRoot), PROFILE_PACKAGES], [profileRoot, ["@deepseek-ai/dsh-settings"]]]) {
			for (const name of names) {
				const location = join(directory, "node_modules", ...name.split("/"));
				mkdirSync(location, { recursive: true });
				writeFileSync(join(location, "package.json"), JSON.stringify({ name, version: state.version }));
			}
		}
		writeFileSync(join(profileRoot, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");
		state.steps.push({ id: "verify", status: "pending" });
		assert.equal(resolveInstalledDshBin(), activeBin);
		assert.deepEqual(profileIssues(), []);
		const webSettings = join(profileRoot, "node_modules", "@deepseek-ai", "dsh-settings", "package.json");
		writeFileSync(webSettings, JSON.stringify({ name: "@deepseek-ai/dsh-settings", version: "0.0.1" }));
		assert.match(profileIssues().join("\n"), /resolves 0\.0\.1/);
		writeFileSync(webSettings, JSON.stringify({ name: "@deepseek-ai/dsh-settings", version: state.version }));
		const profileManifest = join(dirname(profileRoot), "package.json");
		const stale = JSON.parse(readFileSync(profileManifest, "utf8"));
		stale.pnpm = { overrides: { "@deepseek-ai/dsh-session-query": "0.0.1" } };
		writeFileSync(profileManifest, JSON.stringify(stale));
		assert.match(profileIssues().join("\n"), /override 0\.0\.1/);
		pinExistingPackages(dirname(profileRoot), SESSION_PACKAGES);
		assert.equal(JSON.parse(readFileSync(profileManifest, "utf8")).pnpm.overrides["@deepseek-ai/dsh-session-query"], state.version);
		assert.match(stoppedHostCommand(), /--action offline-repair/);
		state.backup = { status: "skipped" };
		state.finishedAt = Date.now() - 1000;
		state.verificationHostStartedAt = Date.now() - 500;
		state.verificationHostVersion = state.version;
		await verifyOnly();
		assert.equal(state.status, "success");
		assert.equal(state.restartRequired, false);
		assert.equal(state.backup.status, "skipped");
		assert.equal(state.steps.find((step) => step.id === "verify").status, "success");
		state.status = "error";
		state.finishedAt = Date.now();
		state.verificationHostStartedAt = state.finishedAt - 500;
		state.verificationHostVersion = state.version;
		await verifyOnly();
		assert.equal(state.restartRequired, true);
		rmSync(activeBin);
		await assert.rejects(verify(), /launcher is missing/);
		writeFileSync(activeBin, "process.exit(0);");
		const directCommand = await runCommand({ executable: process.execPath, args: ["-e", "process.stdout.write('direct node command passed')"] });
		assert.equal(directCommand.code, 0);
		assert.match(directCommand.output, /direct node command passed/);
		if (process.platform === "win32") {
			const managerPathFirst = join(root, "manager-path-first"), managerPathSecond = join(root, "manager-path-second");
			mkdirSync(managerPathFirst, { recursive: true });
			mkdirSync(managerPathSecond, { recursive: true });
			writeFileSync(join(managerPathFirst, "pnpm.exe"), "fixture");
			mkdirSync(join(managerPathSecond, "node_modules", "corepack", "dist"), { recursive: true });
			writeFileSync(join(managerPathSecond, "node_modules", "corepack", "dist", "pnpm.js"), "fixture");
			assert.equal(resolvePackageManagerCommand({ executable: "pnpm", args: ["--version"] }, managerPathFirst + ";" + managerPathSecond).executable, join(managerPathFirst, "pnpm.exe"));
			const npmCommand = await runCommand({ executable: "npm", args: ["--version"] });
			assert.equal(npmCommand.code, 0, npmCommand.output);
			assert.match(npmCommand.output.trim(), /^\d+\.\d+\.\d+/);
			const npmPrefix = join(root, "custom npm prefix");
			const npmRootCommand = await runCommand({ executable: "npm", args: ["root", "--global", "--prefix", npmPrefix] });
			assert.equal(npmRootCommand.code, 0, npmRootCommand.output);
			assert.equal(sameDirectory(dirname(packageManagerGlobalNodeModules(npmRootCommand.output)), npmPrefix), true);
			let pnpmAvailable = false;
			try { resolvePackageManagerCommand({ executable: "pnpm", args: [] }); pnpmAvailable = true; } catch { /* NPM-only Windows setup */ }
			if (pnpmAvailable) {
				const pnpmCommand = await runCommand({ executable: "pnpm", args: ["--version"] });
				assert.equal(pnpmCommand.code, 0, pnpmCommand.output);
				assert.match(pnpmCommand.output.trim(), /^\d+\.\d+\.\d+/);
				const pnpmRootCommand = await runCommand({ executable: "pnpm", args: ["root", "--global"] });
				assert.equal(pnpmRootCommand.code, 0, pnpmRootCommand.output);
				assert.equal(basename(packageManagerGlobalNodeModules(pnpmRootCommand.output)).toLowerCase(), "node_modules");
			}
			const specialArgs = ["C:\\Users\\Name With Space\\100% ready\\a^b&c", "tail\\"];
			const directArgs = await runCommand({ executable: process.execPath, args: ["-e", "process.stdout.write(JSON.stringify(process.argv.slice(1)))", ...specialArgs] });
			assert.equal(directArgs.code, 0);
			assert.deepEqual(JSON.parse(directArgs.output), specialArgs);
		}
		const timedOutCommand = await runCommand({ executable: process.execPath, args: ["-e", "setInterval(() => {}, 1000)"] }, undefined, 50);
		assert.equal(timedOutCommand.code, null);
		assert.match(timedOutCommand.error?.message ?? "", /timed out/);
		if (process.platform === "win32") {
			const marker = join(root, "orphaned-command-child");
			const childCode = `setTimeout(() => require('node:fs').writeFileSync(${JSON.stringify(marker)}, 'alive'), 500)`;
			const parentCode = `require('node:child_process').spawn(${JSON.stringify(process.execPath)}, ['-e', ${JSON.stringify(childCode)}], {stdio:'ignore',windowsHide:true}); process.send('ready'); setInterval(() => {}, 1000)`;
			const parent = spawn(process.execPath, ["-e", parentCode], { stdio: ["ignore", "ignore", "ignore", "ipc"], windowsHide: true });
			const closed = new Promise((resolve) => parent.once("close", resolve));
			const ready = await new Promise((resolve, reject) => { parent.once("message", resolve); parent.once("error", reject); });
			assert.equal(ready, "ready");
			stopCommandTree(parent);
			await closed;
			await new Promise((resolve) => setTimeout(resolve, 700));
			assert.equal(existsSync(marker), false, "timed-out Windows command left a descendant running");
		}
		await backup();
		assert.equal(isBackupComplete(state.backup), true);
		const firstBackup = state.backup.root;
		await backup();
		assert.notEqual(state.backup.root, firstBackup);
		state.backupOptions.enabled = false;
		await backup();
		assert.equal(state.backup.status, "skipped");
		assert.equal(state.steps[0].status, "skipped");
		state.hostPid = process.pid;
		assert.throws(assertHostStopped, /DSH is still running/);
		assert.match(offlineInstructions(["stop first"], "rollback").repairCommand, /--action rollback/);
		delete state.hostPid;
		state.backupOptions.enabled = true;
		rmSync(join(activePackage, "package.json"));
		try { await backup(); assert.fail("invalid active package must fail"); }
		catch (error) { fail("update-failed", error); }
		assert.equal(state.backup.status, "error");
		assert.deepEqual(state.actions, ["retry-backup"]);
		assert.equal(JSON.parse(readFileSync(join(state.backup.root, "manifest.json"))).backup.status, "error");
		console.log("worker self-test passed");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
	process.exit(0);
}

if (!statePath) process.exit(2);

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
	const manual = action === "rollback" ? /DSH is still running/.test(message) ? offlineInstructions([message], "rollback") : null : action === "offline-repair" ? offlineInstructions([message, ...profileIssues()]) : /profile|dump-config|EADDRINUSE|running/i.test(message) ? offlineInstructions([message, ...profileIssues()]) : null;
	if (state.backup?.status === "running") {
		save({ backup: { ...state.backup, status: "error", phase: "failed", error: message, finishedAt: Date.now() } });
		try { writeBackupManifest(); } catch (manifestError) { append("[backup] manifest write failed: " + manifestError.message); }
	}
	const actions = action === "offline-repair" || action === "rollback" ? [] : isBackupComplete(state.backup, state.id) ? ["repair", "rollback"] : state.backup?.status === "skipped" ? ["repair"] : ["retry-backup"];
	if (state.version !== undefined && state.version === verifyInstalledVersion()) actions.unshift("verify");
	save({ status: "error", stage: "failed", reason, error: message, manual, steps: (state.steps ?? []).map((step) => step.status === "running" ? { ...step, status: "error" } : step), actions, finishedAt: Date.now() });
}

function writeBackupManifest(backupInfo = state.backup) {
	writeFileSync(join(backupInfo.root, "manifest.json"), JSON.stringify({ state: { id: state.id, version: state.version, previousVersion: state.previousVersion, globalRoot: state.globalRoot, profileRoot: state.profileRoot }, backup: backupInfo }, null, 2), "utf8");
}

async function linkType(path) {
	if (process.platform !== "win32") return undefined;
	try { return (await stat(path)).isDirectory() ? "junction" : "file"; }
	catch (error) {
		if (error.code !== "ENOENT") throw error;
		// A dangling Windows link still retains its directory attribute.
		const directory = execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", "[bool]((Get-Item -LiteralPath $env:DSH_BACKUP_LINK -Force -ErrorAction Stop).Attributes -band [IO.FileAttributes]::Directory)"], { env: { ...process.env, DSH_BACKUP_LINK: path }, windowsHide: true, encoding: "utf8" }).trim();
		return directory === "True" ? "junction" : "file";
	}
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
			await symlink(await readlink(sourcePath), targetPath, await linkType(sourcePath));
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
		const match = metadata.match(/"?virtualStoreDir"?\s*:\s*(?:"((?:\\.|[^"])*)"|'([^']*)'|([^\s,}]+))/);
		if (match === null) return undefined;
		const value = match[1] === undefined
			? match[2] === undefined ? match[3] : match[2].replaceAll("\\\\", "\\")
			: JSON.parse('"' + match[1] + '"');
		return /^(?:[A-Za-z]:[\\/]|\\\\|\/)/.test(value) && !/[\r\n"]/.test(value) ? value : undefined;
	}
}

function commandText(command) {
	return [/[\s&"]/.test(command.executable) ? '"' + command.executable + '"' : command.executable, ...command.args.map((arg) => /[\s&"]/.test(arg) ? '"' + arg + '"' : arg)].join(" ");
}

function stopCommandTree(child) {
	if (!Number.isInteger(child.pid) || child.pid <= 0) return;
	if (process.platform === "win32") {
		try {
			execFileSync(join(process.env.SystemRoot ?? "C:\\Windows", "System32", "taskkill.exe"), ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true, timeout: 10000 });
			return;
		} catch {
			// Fall back to the direct child; do not start another update before it closes.
		}
	}
	child.kill();
}

function resolvePackageManagerCommand(command, pathValue = process.env.PATH ?? "") {
	if (process.platform !== "win32" || !/^(?:npm|pnpm)$/i.test(command.executable)) return command;
	const manager = command.executable.toLowerCase();
	const relativeCandidates = manager === "npm"
		? [join("node_modules", "npm", "bin", "npm-cli.js")]
		: [join("node_modules", "pnpm", "bin", "pnpm.cjs"), join("node_modules", "pnpm", "bin", "pnpm.js"), join("node_modules", "corepack", "dist", "pnpm.js")];
	const directories = [...pathValue.split(";").map((entry) => entry.trim().replace(/^"|"$/g, "")), dirname(process.execPath), process.env.PNPM_HOME, process.env.APPDATA && join(process.env.APPDATA, "npm")].filter(Boolean);
	for (const directory of new Set(directories)) {
		const standalone = join(directory, manager + ".exe");
		if (existsSync(standalone)) return { executable: standalone, args: command.args };
		for (const relativePath of relativeCandidates) {
			const candidate = join(directory, relativePath);
			if (existsSync(candidate)) return { executable: process.execPath, args: [candidate, ...command.args] };
		}
	}
	throw new Error("could not resolve the Windows " + manager + " CLI from PATH");
}

function runCommand(command, cwd, timeoutMs = COMMAND_TIMEOUT_MS) {
	return new Promise((resolve) => {
		let output = "";
		let settled = false;
		const text = commandText(command);
		const runnable = resolvePackageManagerCommand(command);
		const child = spawn(runnable.executable, runnable.args, { cwd, windowsHide: true, stdio: ["ignore", "pipe", "pipe"], shell: false });
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
		let timedOut = false;
		const timer = setTimeout(() => { timedOut = true; stopCommandTree(child); }, timeoutMs);
		child.once("error", (error) => finish({ code: null, error }));
		child.once("close", (code) => finish(timedOut ? { code: null, error: new Error("command timed out") } : { code }));
	});
}

function verifyInstalledVersion() {
	const packagePath = join(state.globalRoot, "node_modules", "@deepseek-ai", "dsh", "package.json");
	try {
		const pkg = JSON.parse(readFileSync(packagePath, "utf8"));
		return pkg.name === "@deepseek-ai/dsh" ? pkg.version : undefined;
	} catch {
		return undefined;
	}
}

function installedPackageVersion(root, name) {
	try {
		const pkg = JSON.parse(readFileSync(join(root, "node_modules", ...name.split("/"), "package.json"), "utf8"));
		return pkg.name === name ? pkg.version : undefined;
	} catch { return undefined; }
}

function profileIssues() {
	const profile = dirname(state.profileRoot);
	const roots = [[profile, PROFILE_PACKAGES], [state.profileRoot, ["@deepseek-ai/dsh-settings"]]];
	if (state.method === "pnpm") roots.unshift([state.globalRoot, PROFILE_PACKAGES]);
	const issues = [];
	for (const [root, names] of roots) {
		let manifest;
		try { manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8")); }
		catch { issues.push(root + ": package.json missing or invalid"); continue; }
		for (const name of names) {
			const declared = manifest.dependencies?.[name];
			const installed = installedPackageVersion(root, name);
			if (declared !== undefined && declared !== state.version) issues.push(root + ": " + name + " declares " + declared);
			if (declared !== undefined && installed !== state.version) issues.push(root + ": " + name + " resolves " + (installed ?? "missing"));
			const override = manifest.pnpm?.overrides?.[name];
			if (override !== undefined && override !== state.version) issues.push(root + ": " + name + " override " + override);
		}
	}
	for (const name of ["@deepseek-ai/dsh-base", "@deepseek-ai/dsh-web-app"]) {
		const installed = installedPackageVersion(profile, name);
		if (installed !== undefined && installed !== state.version) issues.push(profile + ": " + name + " resolves " + installed);
	}
	const copy = join(profile, "node_modules.pnpm-copy");
	if (existsSync(copy)) {
		try { if (!sameDirectory(realpathSync(copy), realpathSync(join(profile, "node_modules")))) issues.push(copy + " points to a different dependency tree"); }
		catch { issues.push(copy + " cannot be resolved"); }
	}
	return issues;
}

function stoppedHostCommand(nextAction = "offline-repair") {
	return commandText({ executable: process.execPath, args: [fileURLToPath(import.meta.url), "--state", statePath, "--action", nextAction] });
}

function offlineInstructions(issues, nextAction = "offline-repair") {
	return { stopCommand: "关闭 DSH Web 启动窗口，确认 DSH 进程已退出", repairCommand: stoppedHostCommand(nextAction), note: "操作尚未完成。先确认备份可用，再在 PowerShell 执行命令；完成后重新启动 DSH。\n" + issues.join("\n") };
}

function assertHostStopped() {
	if (!Number.isInteger(state.hostPid)) return;
	try { process.kill(state.hostPid, 0); throw new Error("DSH is still running; close it before changing profiles"); }
	catch (error) { if (error.code !== "ESRCH") throw error; }
}

function pinExistingPackages(root, names) {
	const path = join(root, "package.json");
	const source = readFileSync(path, "utf8");
	const manifest = JSON.parse(source);
	for (const name of names) {
		if (manifest.dependencies?.[name] !== undefined) manifest.dependencies[name] = state.version;
		if (manifest.pnpm?.overrides?.[name] !== undefined) manifest.pnpm.overrides[name] = state.version;
	}
	const indentation = /^\s+"(?:dependencies|name)"/m.exec(source)?.[0].match(/^\s+/)?.[0] ?? "  ";
	const temporary = stateTemporaryPath(path);
	try {
		writeFileSync(temporary, JSON.stringify(manifest, null, indentation) + "\n", "utf8");
		renameSync(temporary, path);
	} finally { try { rmSync(temporary, { force: true }); } catch {} }
}

async function offlineRepair() {
	try {
		if (state.status !== "needs-offline-repair" && !(state.status === "error" && state.reason === "offline-repair-failed")) throw new Error("offline repair is not pending");
		assertHostStopped();
		const globalRootResult = await runCommand(globalRootCommand(state.method, state.globalRoot));
		if (globalRootResult.code !== 0) throw globalRootResult.error ?? new Error("could not read the package manager global root");
		verifyGlobalRoot(globalRootResult.output, state.globalRoot, state.method);
		const profile = dirname(state.profileRoot);
		const roots = [[profile, PROFILE_PACKAGES], [state.profileRoot, ["@deepseek-ai/dsh-settings"]]];
		if (state.method === "pnpm") roots.unshift([state.globalRoot, PROFILE_PACKAGES]);
		const specs = new Set();
		for (const [root, names] of roots) {
			const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
			for (const name of names) if (manifest.dependencies?.[name] !== undefined) specs.add(name);
		}
		for (const name of specs) {
			const check = await runCommand({ executable: "pnpm", args: ["view", name + "@" + state.version, "version"] });
			if (check.code !== 0 || !check.output.includes(state.version)) throw new Error("target package is unavailable: " + name + "@" + state.version);
		}
		save({ status: "running", stage: "profile-repair" });
		updateStep("profile-repair", "running");
		if (state.method === "npm") {
			const command = { executable: "npm", args: ["install", "--global", "--prefix", state.globalRoot, "@deepseek-ai/dsh@" + state.version] };
			append("[global] " + commandText(command));
			const result = await runCommand(command);
			if (result.code !== 0) throw result.error ?? new Error("global DSH install failed");
		}
		for (const [root, names] of roots) {
			pinExistingPackages(root, names);
			const command = root === state.globalRoot
				? { executable: "pnpm", args: ["install", "--global", "--force"] }
				: { executable: "pnpm", args: ["install", "--dir", root] };
			append("[profile] " + commandText(command));
			const result = await runCommand(command);
			if (result.code !== 0) throw result.error ?? new Error("dependency repair failed in " + root);
		}
		if (verifyInstalledVersion() !== state.version) throw new Error("global DSH version did not reach " + state.version);
		const issues = profileIssues();
		if (issues.length) throw new Error("dependency repair incomplete:\n" + issues.join("\n"));
		updateStep("profile-repair", "success");
		save({ status: "restart-required", stage: "restart-required", restartRequired: true, manual: null, actions: ["verify"], finishedAt: Date.now() });
	} catch (error) { fail("offline-repair-failed", error); }
}

function resolveInstalledDshBin() {
	const packageRoot = join(state.globalRoot, "node_modules", "@deepseek-ai", "dsh");
	const pkg = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8"));
	if (pkg.name !== "@deepseek-ai/dsh") throw new Error("active package is not @deepseek-ai/dsh");
	const relativeBin = typeof pkg.bin === "string" ? pkg.bin : pkg.bin?.dsh;
	if (typeof relativeBin !== "string" || relativeBin === "") throw new Error("target DSH package does not declare a dsh launcher");
	const bin = resolve(packageRoot, relativeBin);
	const fromPackage = relative(packageRoot, bin);
	if (isAbsolute(fromPackage) || fromPackage === ".." || fromPackage.startsWith(".." + sep) || !existsSync(bin)) throw new Error("target DSH launcher is missing from the installed package");
	return bin;
}

async function backup() {
	if (state.backupOptions?.enabled === false) {
		save({ backup: { status: "skipped" } });
		updateStep("backup", "skipped");
		return;
	}
	updateStep("backup", "running");
	save({ stage: "backup" });
	const dshHome = dirname(dirname(state.profileRoot));
	const parent = await validateBackupDirectory(state.backupOptions?.directory ?? join(dirname(statePath), "backups"), [state.globalRoot, dshHome]);
	const backupRoot = join(parent, Date.now() + "-" + state.id + "-" + randomBytes(4).toString("hex"));
	mkdirSync(backupRoot, { recursive: true });
	const globalTarget = join(backupRoot, "global");
	const dshTarget = join(backupRoot, "dsh");
	save({ backup: { root: backupRoot, global: globalTarget, dsh: dshTarget, status: "running", phase: "scanning", createdAt: Date.now() } });
	writeBackupManifest();
	registerBackup(dirname(statePath), { id: basename(backupRoot), path: backupRoot, createdAt: state.backup.createdAt, previousVersion: state.previousVersion, version: state.version });
	if (!verifyInstalledVersion()) throw new Error("active DSH package is missing or invalid; cannot create a restorable backup");
	const reportScan = (offsetFiles, offsetBytes, progress) => save({ backup: { ...state.backup, scannedFiles: offsetFiles + progress.files, scannedBytes: offsetBytes + progress.bytes, currentItem: progress.currentItem } });
	const globalSummary = await scanTree(state.globalRoot, (progress) => reportScan(0, 0, progress));
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
	const backupInfo = { ...state.backup, files: totalFiles, bytes: totalBytes, completedFiles: totalFiles, copiedBytes: totalBytes, progress: 100, status: "complete", phase: "complete", finishedAt: Date.now() };
	writeBackupManifest(backupInfo);
	updateStep("backup", "success", { detail: backupInfo });
	save({ backup: backupInfo });
	append("[backup] created " + backupRoot + " (" + backupInfo.files + " files)");
}

function preflightCommand(method, version) {
	return { executable: method === "npm" ? "npm" : "pnpm", args: ["view", "@deepseek-ai/dsh@" + version, "version", "--json"] };
}

function packageManagerGlobalNodeModules(output) {
	const path = String(output).split(/\r?\n/).map((line) => line.trim()).filter(Boolean).at(-1)?.replace(/^['"]|['"]$/g, "");
	if (!path || !isAbsolute(path)) throw new Error("package manager did not report an absolute global node_modules path");
	return path;
}

function globalRootCommand(method, root) {
	return method === "npm"
		? { executable: "npm", args: ["root", "--global", "--prefix", root] }
		: { executable: "pnpm", args: ["root", "--global"] };
}

function sameDirectory(left, right) {
	const normalize = (path) => path.replaceAll("\\", "/").replace(/\/$/, "");
	const first = normalize(left), second = normalize(right);
	return process.platform === "win32" ? first.toLowerCase() === second.toLowerCase() : first === second;
}

function verifyGlobalRoot(output, expectedRoot, method) {
	const actualRoot = dirname(packageManagerGlobalNodeModules(output));
	if (!sameDirectory(actualRoot, expectedRoot)) throw new Error(method + " global root changed; refusing to update " + actualRoot + " instead of " + expectedRoot);
	return actualRoot;
}

async function preflight() {
	updateStep("preflight", "running");
	save({ stage: "preflight" });
	append("[preflight] checking exact npm target " + state.version);
	if (state.method === "npm" || state.method === "pnpm") {
		const globalRootResult = await runCommand(globalRootCommand(state.method, state.globalRoot));
		if (globalRootResult.code !== 0) throw globalRootResult.error ?? new Error("could not read " + state.method + " global root");
		verifyGlobalRoot(globalRootResult.output, state.globalRoot, state.method);
	}
	const command = preflightCommand(state.method, state.version);
	const result = await runCommand(command);
	if (result.code !== 0) throw result.error ?? new Error("target package preflight failed");
	if (!result.output.includes(state.version)) throw new Error("package manager returned an unexpected target version");
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
	const normalizeStorePath = (path) => process.platform === "win32" ? path.replaceAll("\\", "/").replace(/\/$/, "").toLowerCase() : path;
	if (virtualStoreDir !== undefined && normalizeStorePath(virtualStoreDir) !== normalizeStorePath(expectedVirtualStoreDir)) throw new Error("global virtual store is still " + virtualStoreDir);
	const issues = profileIssues();
	if (issues.length) throw new Error("profile dependencies are not aligned:\n" + issues.join("\n"));
	const profileFiles = ["package.json", "pnpm-lock.yaml", "cordis.patch.yml", "dsh.profile"].filter((file) => existsSync(join(state.profileRoot, file)));
	if (!existsSync(join(state.profileRoot, "package.json")) || profileFiles.length < 2) throw new Error("web profile is incomplete; expected package.json plus profile lock or patch metadata");
	const dshBin = resolveInstalledDshBin();
	const result = await runCommand({ executable: process.execPath, args: [dshBin, "--profile", "web", "--dump-config"] }, dirname(dirname(state.profileRoot)));
	if (result.code !== 0) throw result.error ?? new Error("target DSH profile validation failed");
	updateStep("verify", "success", { detail: { installedVersion: actual, virtualStoreDir, warnings: state.warnings ?? [] } });
	append("[verify] installed version " + actual + "; profile validation passed");
}

async function verifyOnly() {
	try {
		if (verifyInstalledVersion() !== state.version) throw new Error("installed DSH version is not the requested target");
		const issues = profileIssues();
		if (issues.length) {
			save({ status: "needs-offline-repair", stage: "profile-repair-required", manual: offlineInstructions(issues), actions: [], finishedAt: Date.now() });
			return;
		}
		await verify();
		const previousFinishedAt = state.finishedAt ?? state.failedAt ?? state.startedAt ?? 0;
		const restartedWithTarget = Number.isFinite(state.verificationHostStartedAt) && state.verificationHostStartedAt > previousFinishedAt && state.verificationHostVersion === state.version;
		const restartRequired = !restartedWithTarget;
		save({ status: restartRequired ? "restart-required" : "success", stage: restartRequired ? "restart-required" : "verification-complete", action: "verify", actions: restartRequired ? ["verify"] : [], restartRequired, finishedAt: Date.now() });
	} catch (error) {
		fail("verification-failed", error);
	}
}

async function runUpdate() {
	try {
		if (!isBackupComplete(state.backup, state.id) && state.backup?.status !== "skipped") await backup();
		await preflight();
		const pending = profileIssues();
		if (pending.length) {
			updateStep("profile-repair", "pending");
			save({ status: "needs-offline-repair", stage: "profile-repair-required", manual: offlineInstructions(pending), actions: [], restartRequired: true, finishedAt: Date.now() });
			return;
		}
		await install();
		const issues = profileIssues();
		if (issues.length) {
			updateStep("profile-repair", "pending");
			save({ status: "needs-offline-repair", stage: "profile-repair-required", manual: offlineInstructions(issues), actions: [], restartRequired: true, finishedAt: Date.now() });
			return;
		}
		await verify();
		save({ status: "restart-required", stage: "restart-required", actions: ["verify"], restartRequired: true, finishedAt: Date.now() });
	} catch (error) {
		fail("update-failed", error);
	}
}

async function restoreTree(source, target, recoverySuffix) {
	if (!existsSync(source)) throw new Error("backup tree is missing: " + source);
	const recoveryRoot = target + recoverySuffix;
	if (existsSync(target)) renameSync(target, recoveryRoot);
	await copyTree(source, target, () => {});
	return recoveryRoot;
}

async function rollback() {
	try {
		assertHostStopped();
		if (!isBackupComplete(state.backup, state.id)) throw new Error("complete backup is unavailable");
		save({ stage: "rolling-back" });
		const recoverySuffix = ".recovery-" + state.id;
		const recoveryRoot = await restoreTree(state.backup.global, state.globalRoot, recoverySuffix);
		const profileBackup = join(state.backup.dsh, "profiles", "web");
		const profileRecoveryRoot = existsSync(profileBackup) ? await restoreTree(profileBackup, state.profileRoot, recoverySuffix) : undefined;
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
	if (action === "offline-repair") return offlineRepair();
	if (action === "verify") return verifyOnly();
	if (action === "repair") return runUpdate();
	return runUpdate();
}

void main();
