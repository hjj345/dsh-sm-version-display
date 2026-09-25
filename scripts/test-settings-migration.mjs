import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../client/client.js", import.meta.url), "utf8");
const start = source.indexOf("function remoteSettingsScope(remote) {");
const end = source.indexOf("\n\t\tfunction useSettingsSnapshot", start);
assert(start >= 0 && end > start, "remote settings scope exists");
const createScope = new Function("remote", "window", "NS", "DEFAULT_SETTINGS", "decodeSettings", `${source.slice(start, end)}\nreturn remoteSettingsScope(remote);`);
const decodeSettings = (value) => ({ language: ["zh", "en", "zh-TW"].includes(value?.language) ? value.language : "zh", enabled: typeof value?.enabled === "boolean" ? value.enabled : true });

async function run(user, write = true) {
	const writes = [];
	let current = { language: "zh", enabled: true, ...user };
	let saved = JSON.stringify({ language: "en", enabled: false });
	const remote = { settings: {
		describe: async () => ({ writable: true, namespaces: [{ ns: "dsh-sm-version-display", revision: 3, value: current, user }] }),
		update: async (ns, patch, revision) => { writes.push({ ns, patch, revision }); current = { ...current, ...patch }; return { revision: revision + 1, value: current }; }
	} };
	const scope = createScope(remote, { localStorage: { getItem: () => saved, removeItem: () => { saved = null; } } }, "dsh-sm-version-display", { language: "zh", enabled: true }, decodeSettings);
	if (write) await scope.set("enabled", true);
	return { scope, writes, getSaved: () => saved };
}

const migrated = await run({});
assert.deepEqual(migrated.writes, [
	{ ns: "dsh-sm-version-display", patch: { language: "en", enabled: false }, revision: 3 },
	{ ns: "dsh-sm-version-display", patch: { enabled: true }, revision: 4 }
]);
assert.equal(migrated.getSaved(), null, "legacy browser settings are removed only after migration");
assert.deepEqual(migrated.scope.getSnapshot().value, { language: "en", enabled: true });

const preserved = await run({ enabled: false }, false);
assert.deepEqual(preserved.writes[0], { ns: "dsh-sm-version-display", patch: { language: "en" }, revision: 3 });
assert.equal(preserved.scope.getSnapshot().value.enabled, false, "profile values take precedence over legacy browser settings");
console.log("✔ Settings migration: legacy import, profile precedence, and revision updates");
