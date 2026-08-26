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

/**
* Read the running harness version from the installed packages.
* @returns the version string, or "unknown" when nothing resolves.
*/
function resolveDshVersion() {
	for (const spec of VERSION_CANDIDATES) {
		try {
			const pkgPath = require.resolve(spec);
			const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
			if (typeof pkg.version === "string" && pkg.version !== "") return pkg.version;
		} catch {
			// try the next candidate
		}
	}
	return "unknown";
}

/**
* Contribute the version global on every index render.
* @param ctx - plugin context carrying the webServer service.
*/
function apply(ctx) {
	ctx.on("webserver/index-inject", (table) => {
		table.push({
			kind: "global",
			name: "__DSH_VERSION__",
			value: resolveDshVersion()
		});
	});
}

export { apply, inject, name };
