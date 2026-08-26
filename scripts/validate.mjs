// dsh-sm-version-display 构建验证脚本（本插件为手写 bundle，无编译步骤，验证即构建）
// 用法：node scripts/validate.mjs
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const checks = [
	["lib/index.js", "host 半区"],
	["client/client.js", "client 半区 bundle"]
];
for (const [file, label] of checks) {
	try {
		execFileSync(process.execPath, ["--check", join(root, file)], { stdio: "pipe" });
		console.log("✔ 语法通过:", file, "(" + label + ")");
	} catch (error) {
		console.error("✘ 语法错误:", file, "(" + label + ")");
		console.error(error.stderr?.toString() ?? error.message);
		process.exitCode = 1;
	}
}

// 从 client bundle 提取真实函数并跑版本比较自测
const clientSrc = readFileSync(join(root, "client", "client.js"), "utf8");
const start = clientSrc.indexOf("function parseVersion");
const end = clientSrc.indexOf("/** Fetch the latest");
const funcs = clientSrc.slice(start, end).trim();
const sandbox = { module: { exports: {} } };
new Function("module", "exports", funcs + "\nmodule.exports = { parseVersion, compareVersions };")(
	sandbox.module, sandbox.module.exports
);
const { compareVersions } = sandbox.module.exports;
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
		console.error("✘ 版本比较失败:", a, "vs", b, "=>", got, "(期望", expected + ")");
		failed++;
	}
}
console.log(failed === 0 ? "✔ 版本比较逻辑: " + cases.length + "/" + cases.length + " 用例通过" : "✘ 版本比较逻辑: " + failed + " 个用例失败");

// 包完整性
for (const file of ["package.json", "cordis.patch.yml", "lib/index.js", "client/client.js"]) {
	if (!readFileSync(join(root, file), "utf8")) {
		console.error("✘ 缺少文件:", file);
		process.exitCode = 1;
	}
}
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
console.log("✔ 包信息:", pkg.name + "@" + pkg.version);
console.log("构建验证完成");
