// dsh-sm-version-display 构建验证脚本（本插件为手写 bundle，无编译步骤，验证即构建）
// 用法：node scripts/validate.mjs
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const fail = (message) => {
	failures.push(message);
	console.error("✘", message);
};
const checks = [
	["lib/index.js", "host 半区"],
	["client/client.js", "client 半区 bundle"]
];
for (const [file, label] of checks) {
	try {
		execFileSync(process.execPath, ["--check", join(root, file)], { stdio: "pipe" });
		console.log("✔ 语法通过:", file, "(" + label + ")");
	} catch (error) {
		fail("语法错误: " + file + " (" + label + ")");
		console.error(error.stderr?.toString() ?? error.message);
	}
}

// 从 client bundle 提取真实函数并跑版本比较自测
const clientSrc = readFileSync(join(root, "client", "client.js"), "utf8");
const start = clientSrc.indexOf("function parseVersion");
const end = clientSrc.indexOf("const zh =");
if (start < 0 || end < 0 || end <= start) fail("无法从 client bundle 提取版本比较函数");
const funcs = clientSrc.slice(start, end).trim();
const sandbox = { module: { exports: {} } };
new Function("module", "exports", "const FALLBACK_VERSION = 'unknown';\n" + funcs + "\nmodule.exports = { parseVersion, compareVersions, formatVersion };")(
	sandbox.module, sandbox.module.exports
);
const { compareVersions, formatVersion } = sandbox.module.exports;
const cases = [
	["0.1.1-rc.2", "0.1.1-rc.3", -1],
	["0.1.1-rc.3", "0.1.1-rc.2", 1],
	["0.1.1-rc.2", "0.1.1-rc.2", 0],
	["0.1.1", "0.1.1-rc.2", 1],
	["0.1.1-rc.2", "0.1.1", -1],
	["0.2.0", "0.1.1-rc.2", 1],
	["0.1.10", "0.1.9", 1],
	["v0.1.1-rc.2", "0.1.1-rc.2", 0],
	["garbage", "0.1.1", null],
	["0.1.1-beta.1", "0.1.1-alpha.2", 1],
	["0.1.1-rc.2", "0.1.1-rc.10", -1]
];
let failed = 0;
for (const [a, b, expected] of cases) {
	const got = compareVersions(a, b);
	if (got !== expected) {
		fail("版本比较失败: " + a + " vs " + b + " => " + got + " (期望 " + expected + ")");
		failed++;
	}
}
if (failed === 0) {
	console.log("✔ 版本比较逻辑: " + cases.length + "/" + cases.length + " 用例通过");
} else {
	fail("版本比较逻辑: " + failed + " 个用例失败");
}
const displayCases = [
	["0.1.1-rc.2", "v0.1.1-rc.2"],
	["v0.1.1-rc.2", "v0.1.1-rc.2"],
	["unknown", "unknown"]
];
let displayFailed = 0;
for (const [input, expected] of displayCases) {
	const got = formatVersion(input);
	if (got !== expected) {
		fail("版本显示格式化失败: " + input + " => " + got + " (期望 " + expected + ")");
		displayFailed++;
	}
}
if (displayFailed === 0) {
	console.log("✔ 版本显示格式化: " + displayCases.length + "/" + displayCases.length + " 用例通过");
}

// 包发布契约和文档完整性
const requiredFiles = [
	"package.json",
	"cordis.patch.yml",
	"lib/index.js",
	"client/client.js",
	"LICENSE",
	"README.md",
	"README.en.md",
	".gitignore",
	".npmignore"
];
for (const file of requiredFiles) {
	if (!existsSync(join(root, file)) || readFileSync(join(root, file), "utf8").trim() === "") {
		fail("缺少或为空文件: " + file);
	}
}
for (const file of ["images/sm-version-display-icon.png", "images/sm-version-display-icon-outlined.png", "images/sm-version-display-settings-icon.png"]) {
	if (!existsSync(join(root, file)) || readFileSync(join(root, file)).length === 0) fail("缺少或为空图片: " + file);
}
let pkg;
try {
	pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
} catch (error) {
	fail("package.json 不是有效 JSON: " + error.message);
}
if (pkg) {
	const expected = {
		name: "@hjj345345/dsh-sm-version-display",
		version: "1.2.3",
		main: "lib/index.js",
		license: "MIT",
		engine: ">=20",
		patch: "./cordis.patch.yml",
		files: ["lib/index.js", "client/client.js", "images/sm-version-display-icon-outlined.png", "images/sm-version-display-settings-icon.png", "images/Screenshot/", "cordis.patch.yml", "LICENSE", "README.md", "README.en.md"]
	};
	if (pkg.name !== expected.name) fail("npm 包名不符合发布契约: " + pkg.name);
	if (pkg.version !== expected.version) fail("插件版本不符合发布契约: " + pkg.version);
	if (pkg.main !== expected.main) fail("main 不符合发布契约: " + pkg.main);
	if (pkg.exports?.["."] !== "./lib/index.js" || pkg.exports?.["./client"] !== "./client/client.js") fail("exports 不符合发布契约");
	if (pkg.license !== expected.license) fail("许可证不是 MIT: " + pkg.license);
	if (pkg.engines?.node !== expected.engine) fail("Node.js engine 不符合发布契约: " + pkg.engines?.node);
	if (pkg.repository?.url !== "git+https://github.com/hjj345/dsh-sm-version-display.git") fail("repository URL 不符合发布契约");
	if (pkg.homepage !== "https://github.com/hjj345/dsh-sm-version-display") fail("homepage 不符合发布契约");
	if (pkg.dsh?.bundle?.patch !== expected.patch) fail("dsh.bundle.patch 不符合发布契约: " + pkg.dsh?.bundle?.patch);
	if (JSON.stringify(pkg.files) !== JSON.stringify(expected.files)) fail("files 发布白名单不符合预期");
	for (const dependency of ["@deepseek-ai/dsh-client-modules", "@deepseek-ai/dsh-client-ui-settings", "@deepseek-ai/dsh-client-ui-slots", "@deepseek-ai/dsh-client-ui-primitives"]) {
		if (!pkg.dsh?.client?.inject?.includes(dependency)) fail("dsh.client.inject 缺少依赖: " + dependency);
	}
	if (pkg.dsh?.client?.inject?.includes("@deepseek-ai/dsh-client-runtime")) fail("dsh.client.inject 仍包含已过时的 dsh-client-runtime");
	for (const dependency of ["@deepseek-ai/dsh-settings", "@deepseek-ai/schemastery", "react"]) {
		if (pkg.peerDependencies?.[dependency] === undefined) fail("peerDependencies 缺少依赖: " + dependency);
	}
	console.log("✔ 包信息:", pkg.name + "@" + pkg.version);
}

const hostSrc = readFileSync(join(root, "lib", "index.js"), "utf8");
for (const fragment of ["SETTINGS_NAMESPACE", "settingsCtx.settings.register(SETTINGS_NAMESPACE, SettingsSchema", "webServer.register", "__DSH_INSTALL_INFO__", "__DSH_UPDATE_TOKEN__", "x-dsh-sm-version-display-token", "CHECK_ROUTE", "UPDATE_STATUS_ROUTE", "GITHUB_RELEASES_URL", "GITHUB_RELEASES_FEED_URL", "fetchGithubLatestFromFeed", "github-rate-limit", "npmAvailable", "@deepseek-ai/dsh@"]){
	if (!hostSrc.includes(fragment)) fail("host 半区缺少功能契约: " + fragment);
}
for (const fragment of ["settings.section", "order: 22", "v1.2.3", "2026-09-03", "SETTINGS_ICON_DATA_URL", "CHECK_ROUTE", "UPDATE_STATUS_ROUTE", "dvd-settings-version-grid", "settings.confirmTitle", "settings.updateLog", "settings.githubRateLimited", "settings.checkChannel", "settings.feed.atom", "npm install --global", "npx --yes", "dsh-v", "settings.checkVersion"]) {
	if (!clientSrc.includes(fragment)) fail("client 半区缺少功能契约: " + fragment);
}
const localizedKeys = ["settings.source.npm", "settings.source.github", "settings.versionType", "settings.type.alpha", "settings.type.beta", "settings.type.rc", "settings.type.release", "settings.confirmTitle", "settings.confirmWarning", "settings.updateLog", "settings.command.githubSource", "settings.stepSource", "settings.channel.latest", "settings.openRelease"];
for (const key of localizedKeys) {
		const occurrences = clientSrc.split("\"" + key + "\"").length - 1;
		if (occurrences < 3) fail("多语言文案未覆盖 zh/en/zh-TW: " + key);
}
const settingsIconBase64 = readFileSync(join(root, "images", "sm-version-display-settings-icon.png")).toString("base64");
if (!clientSrc.includes("data:image/png;base64," + settingsIconBase64)) fail("设置页内联图标与 PNG 文件不一致");

const readmeChecks = [
	["README.md", [">= v0.1.0-rc.6", "v1.2.3", "2026-09-03", "images/sm-version-display-icon-outlined.png", "@hjj345345/dsh-sm-version-display", "README.en.md", "## 更新日志", "Jack·Huang", "jack698698@gmail.com"]],
	["README.en.md", [">= v0.1.0-rc.6", "v1.2.3", "2026-09-03", "images/sm-version-display-icon-outlined.png", "@hjj345345/dsh-sm-version-display", "README.md", "## Changelog", "Jack·Huang", "jack698698@gmail.com"]]
];
for (const [file, fragments] of readmeChecks) {
	const content = readFileSync(join(root, file), "utf8");
	for (const fragment of fragments) {
		if (!content.includes(fragment)) fail(file + " 缺少文档内容: " + fragment);
	}
	if (/(?:D:\\android-project|D:\/android-project|C:\\Users|C:\/Users|\\Users\\)/i.test(content)) {
		fail(file + " 包含个人电脑绝对路径");
	}
}

if (failures.length > 0) {
	process.exitCode = 1;
	console.error("构建验证失败:", failures.length, "项");
} else {
	console.log("✔ 发布契约、README 和排除规则检查通过");
	console.log("构建验证完成");
}
