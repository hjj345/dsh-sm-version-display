// dsh-sm-version-display 构建验证脚本（本插件为手写 bundle，无编译步骤，验证即构建）
// 用法：node scripts/validate.mjs
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative, resolve } from "node:path";
import { tmpdir } from "node:os";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const fail = (message) => {
	failures.push(message);
	console.error("✘", message);
};
const checks = [
	["lib/index.js", "host 半区"],
	["lib/update-worker.mjs", "升级 Worker"],
	["lib/backup-manager.mjs", "备份管理"],
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
		version: "1.2.11",
		main: "lib/index.js",
		license: "MIT",
		engine: ">=20",
		patch: "./cordis.patch.yml",
		files: ["lib/index.js", "lib/update-worker.mjs", "lib/backup-manager.mjs", "client/client.js", "images/sm-version-display-icon-outlined.png", "images/sm-version-display-settings-icon.png", "images/Screenshot/", "cordis.patch.yml", "LICENSE", "README.md", "README.en.md"]
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
for (const fragment of ["SETTINGS_NAMESPACE", "settingsCtx.settings.register(SETTINGS_NAMESPACE, SettingsSchema", "webServer.register", "__DSH_INSTALL_INFO__", "__DSH_UPDATE_TOKEN__", "x-dsh-sm-version-display-token", "CHECK_ROUTE", "UPDATE_STATUS_ROUTE", "UPDATE_ACTION_ROUTE", "GITHUB_RELEASES_URL", "GITHUB_RELEASES_FEED_URL", "fetchGithubLatestFromFeed", "github-rate-limit", "npmAvailable", "resolveVirtualStoreDir", "needsPnpmGlobalRepair", "HEARTBEAT_TIMEOUT_MS", "STATE_WRITE_RETRIES", "SharedArrayBuffer", "lastActivityAt", "heartbeatExpired", "[\"install\", \"--global\", \"--force\"]", "@deepseek-ai/dsh@"]){
	if (!hostSrc.includes(fragment)) fail("host 半区缺少功能契约: " + fragment);
}
const launcherStart = hostSrc.indexOf("function resolveDshPackageFromLauncher");
const launcherEnd = hostSrc.indexOf("\nfunction resolveInstallInfo", launcherStart);
if (launcherStart < 0 || launcherEnd <= launcherStart) {
	fail("无法提取 DSH 启动路径版本探测函数");
} else {
	const launcherRoot = mkdtempSync(join(tmpdir(), "dsh-launcher-self-test-"));
	const launcherPackage = join(launcherRoot, "node_modules", "@deepseek-ai", "dsh");
	const { mkdirSync } = await import("node:fs");
	try {
		mkdirSync(join(launcherPackage, "lib"), { recursive: true });
		writeFileSync(join(launcherPackage, "package.json"), JSON.stringify({ name: "@deepseek-ai/dsh", version: "0.1.5-rc.2" }));
		const sandbox = { module: { exports: {} } };
		new Function("module", "exports", "dirname", "join", "resolve", "readFileSync", "versionCandidates", "const VERSION_CANDIDATES = versionCandidates;\n" + hostSrc.slice(launcherStart, launcherEnd) + "\nmodule.exports = resolveDshPackageFromLauncher;")(
			sandbox.module, sandbox.module.exports, dirname, join, resolve, readFileSync, ["@deepseek-ai/dsh/package.json", "@deepseek-ai/dsh-web-app/package.json"]
		);
		const resolved = sandbox.module.exports(relative(root, join(launcherPackage, "lib", "bin.js")));
		if (resolved?.version !== "0.1.5-rc.2" || resolved.pkgPath !== join(launcherPackage, "package.json")) fail("本地插件链接下无法从 DSH 启动器识别版本");
		else console.log("✔ 本地链接版本回退: DSH 启动器路径解析通过");
	} finally { rmSync(launcherRoot, { recursive: true, force: true }); }
}
const globalRootStart = hostSrc.indexOf("function resolveGlobalRootFromPackage");
const globalRootEnd = hostSrc.indexOf("\nfunction resolveDshHome", globalRootStart);
if (globalRootStart < 0 || globalRootEnd <= globalRootStart) {
	fail("无法提取全局安装目录解析函数");
} else {
	const sandbox = { module: { exports: {} } };
	new Function("module", "exports", "dirname", "basename", hostSrc.slice(globalRootStart, globalRootEnd) + "\nmodule.exports = resolveGlobalRootFromPackage;")(
		sandbox.module, sandbox.module.exports, dirname, (path) => path.split(/[\\/]/).at(-1)
	);
	const resolveNpmRoot = sandbox.module.exports;
	if (resolveNpmRoot("C:\\Tools\\Node Global\\node_modules\\@deepseek-ai\\dsh\\package.json") !== "C:\\Tools\\Node Global") fail("自定义 Windows npm prefix 无法识别全局 DSH 根目录");
	if (resolveNpmRoot("C:\\pnpm\\.pnpm\\dsh\\node_modules\\@deepseek-ai\\dsh\\package.json") !== undefined) fail("pnpm 虚拟存储目录被误判为 npm 根目录");
}
const classifyStart = hostSrc.indexOf("function normalizedInstallPath");
const classifyEnd = hostSrc.indexOf("\nfunction parseVirtualStoreDir", classifyStart);
if (classifyStart < 0 || classifyEnd <= classifyStart) {
	fail("无法提取安装方式分类函数");
} else {
	const sandbox = { module: { exports: {} } };
	new Function("module", "exports", "resolve", "dirname", "basename", "join", "readFileSync", "process", hostSrc.slice(classifyStart, classifyEnd) + "\nmodule.exports = classifyDshInstall;")(
		sandbox.module, sandbox.module.exports, resolve, dirname, (path) => path.replaceAll("\\", "/").split("/").at(-1), join, readFileSync, { platform: "win32" }
	);
	const classify = sandbox.module.exports;
	const npmRoot = "C:/Tools/Node Global";
	if (classify(npmRoot + "/node_modules/@deepseek-ai/dsh/package.json", false, npmRoot, { PATH: npmRoot }) !== "npm") fail("自定义 Windows npm prefix 被误判");
	if (classify("D:/work/app/node_modules/@deepseek-ai/dsh/package.json", false, "D:/work/app", { PATH: npmRoot }) !== "unknown") fail("本地 npm 项目依赖被误判为全局安装");
	const pnpmHome = "C:/Users/user/AppData/Local/pnpm";
	const pnpmRoot = pnpmHome + "/global/5";
	if (classify(pnpmRoot + "/node_modules/@deepseek-ai/dsh/package.json", true, pnpmRoot, { PNPM_HOME: pnpmHome }) !== "pnpm") fail("pnpm 全局安装被误判");
	if (classify("D:/work/app/node_modules/.pnpm/dsh/node_modules/@deepseek-ai/dsh/package.json", true, "D:/work/app", { PNPM_HOME: pnpmHome }) !== "unknown") fail("本地 pnpm 项目依赖被误判为全局安装");
	const defaultNpmRoot = "C:/Users/user/AppData/Roaming/npm";
	if (classify(defaultNpmRoot + "/node_modules/@deepseek-ai/dsh/package.json", false, defaultNpmRoot, { APPDATA: "C:/Users/user/AppData/Roaming" }) !== "npm") fail("默认 Windows npm prefix 被误判");
	const shimDirectory = mkdtempSync(join(tmpdir(), "dsh-pnpm-global-shim-"));
	const customPnpmRoot = "D:/Custom Pnpm/global/7";
	try {
		writeFileSync(join(shimDirectory, "dsh.cmd"), "@SET NODE_PATH=" + customPnpmRoot + "\\node_modules");
		if (classify(customPnpmRoot + "/node_modules/@deepseek-ai/dsh/package.json", true, customPnpmRoot, { PATH: shimDirectory }) !== "pnpm") fail("无法从 PNPM launcher shim 识别自定义全局目录");
	} finally { rmSync(shimDirectory, { recursive: true, force: true }); }
	console.log("✔ Windows global npm/pnpm path detection");
}
const failureActionsStart = hostSrc.indexOf("function failureActions");
const failureActionsEnd = hostSrc.indexOf("\nfunction currentState", failureActionsStart);
if (failureActionsStart < 0 || failureActionsEnd <= failureActionsStart) {
	fail("无法提取更新失败恢复操作逻辑");
} else {
	const installedRoot = mkdtempSync(join(tmpdir(), "dsh-failure-action-test-"));
	try {
		const installedPackage = join(installedRoot, "node_modules", "@deepseek-ai", "dsh");
		const { mkdirSync } = await import("node:fs");
		mkdirSync(installedPackage, { recursive: true });
		writeFileSync(join(installedPackage, "package.json"), JSON.stringify({ name: "@deepseek-ai/dsh", version: "0.1.5-rc.3" }));
		const sandbox = { module: { exports: {} } };
		new Function("module", "exports", "isBackupComplete", "readFileSync", "join", hostSrc.slice(failureActionsStart, failureActionsEnd) + "\nmodule.exports = failureActions;")(
			sandbox.module, sandbox.module.exports, (backup) => backup?.status === "complete", readFileSync, join
		);
		const actions = sandbox.module.exports;
		if (JSON.stringify(actions({ version: "0.1.5-rc.3", globalRoot: installedRoot, backupOptions: { enabled: false } })) !== JSON.stringify(["verify", "repair"])) fail("已安装目标版本后缺少安全的重新验证操作");
		if (JSON.stringify(actions({ version: "0.1.5-rc.3", globalRoot: join(installedRoot, "old-running-launcher"), backupOptions: { enabled: false } })) !== JSON.stringify(["repair"])) fail("未安装目标版本时错误提供重新验证操作");
	} finally { rmSync(installedRoot, { recursive: true, force: true }); }
}
const updateCommandStart = hostSrc.indexOf("function updateCommand");
const updateCommandEnd = hostSrc.indexOf("\nfunction startUpdate", updateCommandStart);
if (updateCommandStart < 0 || updateCommandEnd <= updateCommandStart) {
	fail("无法提取更新命令构造函数");
} else {
	const sandbox = { module: { exports: {} } };
	new Function("module", "exports", "needsPnpmGlobalRepair", "formatCommandArg", hostSrc.slice(updateCommandStart, updateCommandEnd) + "\nmodule.exports = updateCommand;")(
		sandbox.module, sandbox.module.exports, () => false, (arg) => /[\\s&\"]/.test(arg) ? '"' + arg + '"' : arg
	);
	const command = sandbox.module.exports("npm", "0.1.5-rc.3", "C:\\Tools\\Node Global");
	if (JSON.stringify(command?.commands?.[0]?.args) !== JSON.stringify(["install", "--global", "--prefix", "C:\\Tools\\Node Global", "@deepseek-ai/dsh@0.1.5-rc.3"])) fail("npm 更新没有绑定当前全局 prefix");
}
const parserStart = hostSrc.indexOf("function parseVirtualStoreDir");
const parserEnd = hostSrc.indexOf("\nfunction resolveVirtualStoreDir", parserStart);
if (parserStart < 0 || parserEnd <= parserStart) {
	fail("无法提取 virtualStoreDir 解析函数");
} else {
	const parserSandbox = { module: { exports: {} } };
	new Function("module", "exports", hostSrc.slice(parserStart, parserEnd) + "\nmodule.exports = { parseVirtualStoreDir };")(parserSandbox.module, parserSandbox.module.exports);
	const { parseVirtualStoreDir } = parserSandbox.module.exports;
	const virtualStoreDir = "C:\\Users\\hjj345\\AppData\\Local\\pnpm\\global\\5\\node_modules\\.pnpm";
	const virtualStoreCases = [
		[JSON.stringify({ virtualStoreDir }), virtualStoreDir],
		['virtualStoreDir: "' + virtualStoreDir.replaceAll("\\", "\\\\") + '"', virtualStoreDir]
	];
	let virtualStoreFailed = 0;
	for (const [metadata, expected] of virtualStoreCases) {
		if (parseVirtualStoreDir(metadata) !== expected) virtualStoreFailed++;
	}
	if (virtualStoreFailed === 0) console.log("✔ virtualStoreDir 解析: " + virtualStoreCases.length + "/" + virtualStoreCases.length + " 用例通过");
	else fail("virtualStoreDir 解析失败: " + virtualStoreFailed + " 个用例");
}
for (const fragment of ["settings.section", "order: 22", "v1.2.11", "2026-09-24", "SETTINGS_ICON_DATA_URL", "CHECK_ROUTE", "UPDATE_STATUS_ROUTE", "UPDATE_ACTION_ROUTE", "HEARTBEAT_TIMEOUT_MS", "heartbeatExpired", "slice(-10)", "dvd-settings-version-grid", "dvd-settings-update-action", "settings.confirmTitle", "settings.updateBoard", "settings.targetVersion", "settings.updateLog", "settings.manualRepair", "settings.step.profileRepair", "settings.githubRateLimited", "settings.checkChannel", "settings.feed.atom", "npm install --global", "npx --yes", "dsh-v", "settings.checkVersion"]) {
	if (!clientSrc.includes(fragment)) fail("client 半区缺少功能契约: " + fragment);
}
const workerSrc = readFileSync(join(root, "lib", "update-worker.mjs"), "utf8");
for (const fragment of ["HEARTBEAT_TIMEOUT_MS", "STATE_WRITE_RETRIES", "SharedArrayBuffer", "lastActivityAt", "scanTree", "copyTree", "--self-test", "command timed out", "rollback-complete"]) {
	if (!workerSrc.includes(fragment)) fail("升级 Worker 缺少功能契约: " + fragment);
}
const commandStart = hostSrc.indexOf("function updateCommand");
const commandEnd = hostSrc.indexOf("\nfunction startUpdate", commandStart);
if (commandStart < 0 || commandEnd <= commandStart) {
	fail("无法提取更新命令构造函数");
} else {
	const sandbox = { module: { exports: {} } };
	new Function("module", "exports", "needsPnpmGlobalRepair", "formatCommandArg", hostSrc.slice(commandStart, commandEnd) + "\nmodule.exports = updateCommand;")(
		sandbox.module, sandbox.module.exports, () => false, (arg) => /[\\s&\"]/.test(arg) ? '"' + arg + '"' : arg
	);
	const command = sandbox.module.exports("npm", "0.1.5-rc.3", "C:\\Tools\\Node Global");
	if (JSON.stringify(command?.commands?.[0]?.args) !== JSON.stringify(["install", "--global", "--prefix", "C:\\Tools\\Node Global", "@deepseek-ai/dsh@0.1.5-rc.3"])) fail("npm global prefix 未绑定到当前 DSH 安装目录");
}
if (hostSrc.includes('const temporary = UPDATE_STATE_FILE + ".tmp"') || workerSrc.includes('const temporary = statePath + ".tmp"')) fail("状态文件仍使用共享临时文件名");
const localizedKeys = ["settings.source.npm", "settings.source.github", "settings.versionType", "settings.type.alpha", "settings.type.beta", "settings.type.rc", "settings.type.release", "settings.confirmTitle", "settings.confirmWarning", "settings.updateLog", "settings.command.githubSource", "settings.stepSource", "settings.channel.latest", "settings.openRelease", "settings.step.backup", "settings.step.preflight", "settings.step.repair", "settings.step.install", "settings.step.profileRepair", "settings.step.verify", "settings.step.running", "settings.step.success", "settings.step.error", "settings.step.pending", "settings.step.skipped", "settings.backupPath", "settings.backupFiles", "settings.peerWarnings", "settings.repair", "settings.rollback", "settings.repairing", "settings.rollingBack", "settings.rollbackFinished", "settings.repairFinished", "settings.actionUnavailable", "settings.manualRepair", "settings.heartbeatTimeout", "settings.heartbeatHelp", "settings.continueWaiting", "settings.updateBoard", "settings.targetVersion", "settings.noCommand"];
for (const key of localizedKeys) {
		const occurrences = clientSrc.split("\"" + key + "\"").length - 1;
		if (occurrences < 3) fail("多语言文案未覆盖 zh/en/zh-TW: " + key);
}
const settingsIconBase64 = readFileSync(join(root, "images", "sm-version-display-settings-icon.png")).toString("base64");
if (!clientSrc.includes("data:image/png;base64," + settingsIconBase64)) fail("设置页内联图标与 PNG 文件不一致");

const readmeChecks = [
	["README.md", [">= v0.1.0-rc.6", "dsh-0.1.5-rc.1", "dsh-0.1.5-rc.2", "v1.2.11", "2026-09-24", "images/sm-version-display-icon-outlined.png", "@hjj345345/dsh-sm-version-display", "README.en.md", "## 更新日志", "Jack·Huang", "jack698698@gmail.com"]],
	["README.en.md", [">= v0.1.0-rc.6", "dsh-0.1.5-rc.1", "dsh-0.1.5-rc.2", "v1.2.11", "2026-09-24", "images/sm-version-display-icon-outlined.png", "@hjj345345/dsh-sm-version-display", "README.md", "## Changelog", "Jack·Huang", "jack698698@gmail.com"]]
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
