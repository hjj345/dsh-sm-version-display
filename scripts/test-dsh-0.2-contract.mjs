import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import SettingsForms from "@deepseek-ai/dsh-settings";
import { SettingsController } from "@deepseek-ai/dsh-api-settings-controller";
import { Config } from "../lib/index.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const lock = readFileSync(join(root, "pnpm-lock.yaml"), "utf8");
assert.equal(pkg.engines.dsh, ">=0.1.7-rc.1 || >=0.2.0-rc.1");
for (const name of ["@deepseek-ai/dsh-api-remotes", "@deepseek-ai/dsh-settings"]) {
	assert.equal(pkg.peerDependencies[name], "^0.1.7-rc.1 || ^0.2.0-rc.1");
	assert.equal(pkg.devDependencies[name], "0.2.0-rc.1");
	assert.match(lock, new RegExp(name.replaceAll("/", "\\/") + "@0\\.2\\.0-rc\\.1"));
}
for (const name of ["@deepseek-ai/dsh", "@deepseek-ai/dsh-api-settings-controller", "@deepseek-ai/dsh-client-ui-primitives", "@deepseek-ai/dsh-client-ui-sidebar"]) assert.equal(pkg.devDependencies[name], "0.2.0-rc.1");
assert.equal(typeof SettingsForms.prototype.configure, "function");
assert.equal(typeof SettingsForms.prototype.describe, "function");
assert.equal(typeof SettingsController.prototype.describe, "function");
assert.equal(typeof SettingsController.prototype.update, "function");

const schema = Config.toJSON();
const fields = schema.refs[schema.uid].dict;
for (const name of ["language", "enabled"]) assert.equal(schema.refs[fields[name]].meta.volatile, true);

const client = readFileSync(join(root, "client", "client.js"), "utf8");
const primitive = readFileSync(join(root, "node_modules", "@deepseek-ai", "dsh-client-ui-primitives", "lib", "index.js"), "utf8");
const exportBlock = [...primitive.matchAll(/export\s*\{([^}]+)\};/gs)].at(-1)?.[1];
assert.ok(exportBlock, "DSH 0.2 UI primitives expose an ESM export block");
const exports = new Set(exportBlock.split(",").map((item) => item.trim().split(/\s+as\s+/).at(-1)));
const used = [...new Set([...client.matchAll(/\bprimitives\.(\w+)/g)].map((match) => match[1]))];
assert.deepEqual(used.filter((name) => !exports.has(name)), [], "plugin UI references only exports in DSH 0.2 primitives");

const sidebar = readFileSync(join(root, "node_modules", "@deepseek-ai", "dsh-client-ui-sidebar", "lib", "types", "client", "contract", "slots.d.ts"), "utf8");
assert.match(sidebar, /'sidebar\.footer\.action'/);
console.log("✔ DSH 0.2 integration contract: settings, remotes, UI exports, and sidebar slot");
