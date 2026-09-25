// Exercise the real route handlers against temporary state; worker spawning is replaced.
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const temporary = mkdtempSync(join(tmpdir(), "dsh-backup-routes-"));
const oldLocal = process.env.LOCALAPPDATA;
const oldHome = process.env.DSH_HOME;
process.env.LOCALAPPDATA = temporary;
process.env.DSH_HOME = join(temporary, "dsh-home");
let spawned = 0;
globalThis.__backupRouteSpawn = () => {
	spawned++;
	const child = new EventEmitter();
	child.pid = process.pid;
	child.unref = () => {};
	return child;
};
try {
	const hostUrl = pathToFileURL(join(root, "lib/index.js")).href;
	let source = readFileSync(join(root, "lib/index.js"), "utf8");
	assert(source.includes('import { spawn } from "node:child_process";'));
	source = source.replace('import { spawn } from "node:child_process";', 'const spawn = globalThis.__backupRouteSpawn;')
		.replaceAll("import.meta.url", JSON.stringify(hostUrl))
		.replace(/from (["'])\.\/backup-manager\.mjs\1/g, "from " + JSON.stringify(pathToFileURL(join(root, "lib/backup-manager.mjs")).href));
	// Resolve the existing peer through the project instead of resolving from the data URL.
	const { createRequire } = await import("node:module");
	const require = createRequire(hostUrl);
	source = source.replace('from "@deepseek-ai/schemastery"', "from " + JSON.stringify(pathToFileURL(require.resolve("@deepseek-ai/schemastery")).href));
	const host = await import("data:text/javascript;base64," + Buffer.from(source).toString("base64"));
	const routes = new Map();
	let token;
	const context = {
		effect: fn => fn(),
		webServer: { register: route => { routes.set(route.path, route.handler); return () => {}; } },
		inject: (_services, fn) => fn({ settings: { configure() { return () => {}; } }, effect: (effect) => effect() }),
		on: (_event, fn) => { const globals = []; fn(globals); token = globals.find(item => item.name === "__DSH_UPDATE_TOKEN__").value; }
	};
	host.apply(context);
	const prefix = "/api/dsh-sm-version-display";
	async function request(path, { method = "GET", body, authorized = true } = {}) {
		const req = new EventEmitter();
		req.method = method;
		req.url = prefix + path;
		req.headers = { origin: "http://localhost:3080", host: "localhost:3080", "x-dsh-sm-version-display-token": authorized ? token : "wrong" };
		req.socket = { remoteAddress: "127.0.0.1" };
		req.setEncoding = () => {};
		let result;
		const res = { statusCode: 200, setHeader() {}, end(text) { result = { status: this.statusCode, ...JSON.parse(text) }; } };
		const handler = routes.get(prefix + path.split("?")[0]);
		assert(handler, "route exists: " + path);
		const pending = handler(req, res);
		queueMicrotask(() => { if (body !== undefined) req.emit("data", JSON.stringify(body)); req.emit("end"); });
		await pending;
		assert(result, "handler ended response: " + path);
		return result;
	}
	for (const [path, method] of [["/backups", "GET"], ["/backups/directories", "GET"], ["/backups/scan", "POST"], ["/backups/delete", "POST"]]) {
		assert.equal((await request(path, { method, authorized: false })).status, 403, path + " requires authorization");
	}
	const empty = await request("/backups");
	assert.equal(empty.status, 200);
	assert.deepEqual(empty.backups, []);
	assert.equal(spawned, 0);
	const stateDir = join(temporary, "dsh-sm-version-display");
	mkdirSync(stateDir, { recursive: true });
	const statePath = join(stateDir, "update-state.json");
	const failed = { id: "0123456789abcdef01234567", status: "error", stage: "failed", version: "0.1.5-rc.3", previousVersion: "0.1.5-rc.2", backup: { status: "error" }, steps: [], lines: [], globalRoot: join(temporary, "global"), profileRoot: join(temporary, "dsh-home/profiles/web") };
	writeFileSync(statePath, JSON.stringify(failed));
	const rollback = await request("/update/action", { method: "POST", body: { jobId: failed.id, action: "rollback" } });
	assert.equal(rollback.status, 409);
	assert.equal(spawned, 0, "incomplete rollback must not spawn worker");
	const invalidJob = await request("/update/action", { method: "POST", body: { jobId: "wrong", action: "retry-backup" } });
	assert.equal(invalidJob.status, 400);
	assert.equal(spawned, 0);
	const deleteTraversal = await request("/backups/delete", { method: "POST", body: { ids: [temporary] } });
	assert(deleteTraversal.status >= 400 || deleteTraversal.errors?.length > 0, "unregistered path cannot be deleted");
	assert.equal(readFileSync(statePath, "utf8"), JSON.stringify(failed));
	const installed = join(failed.globalRoot, "node_modules", "@deepseek-ai", "dsh");
	mkdirSync(installed, { recursive: true });
	writeFileSync(join(installed, "package.json"), JSON.stringify({ name: "@deepseek-ai/dsh", version: failed.version }));
	failed.backup = { status: "skipped" };
	failed.backupOptions = { enabled: false };
	writeFileSync(statePath, JSON.stringify(failed));
	const verify = await request("/update/action", { method: "POST", body: { jobId: failed.id, action: "verify" } });
	assert.equal(verify.status, 202, "installed target can be re-verified without installing again");
	const verifyState = JSON.parse(readFileSync(statePath, "utf8"));
	assert.equal(verifyState.action, "verify");
	assert.equal(verifyState.stage, "verifying");
	assert.equal(verifyState.backup.status, "skipped");
	assert.equal(spawned, 1, "verification action spawns only the isolated fake worker");
	writeFileSync(statePath, JSON.stringify({ ...failed, status: "restart-required", stage: "restart-required", actions: ["verify"], finishedAt: Date.now() - 1000 }));
	const restarted = await request("/update/action", { method: "POST", body: { jobId: failed.id, action: "verify" } });
	assert.equal(restarted.status, 202, "restart-required state can be verified after DSH restarts");
	assert.equal(spawned, 2);
	console.log("✔ Backup/update routes: authorization, incomplete rollback, traversal and verify-only recovery; no real workers spawned");
} finally {
	if (oldLocal === undefined) delete process.env.LOCALAPPDATA; else process.env.LOCALAPPDATA = oldLocal;
	if (oldHome === undefined) delete process.env.DSH_HOME; else process.env.DSH_HOME = oldHome;
	delete globalThis.__backupRouteSpawn;
	rmSync(temporary, { recursive: true, force: true });
}
