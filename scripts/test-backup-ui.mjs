import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

// Isolated element/hook harness: never connects to or updates a DSH service.
let api;
let states = [];
let cursor = 0;
const react = {
  createElement: (type, props, ...children) => ({ type, props: props ?? {}, children: children.flat(Infinity) }),
  Fragment: "fragment",
  useState: (initial) => { const index = cursor++; if (!(index in states)) states[index] = initial; return [states[index], (value) => { states[index] = typeof value === "function" ? value(states[index]) : value; }]; },
  useEffect() {},
  useRef: () => ({ current: null }),
};
const source = fs.readFileSync(new URL("../client/client.js", import.meta.url), "utf8").replace("exports.apply = apply;", "exports.test = { UpdateConfirmModal, UpdateOutputPanel, BackupManager, formatBytes, translate }; exports.apply = apply;");
vm.runInNewContext(source, { window: { __ModuleLoader__: { load: ({ factory }) => { api = factory((name) => name === "react" ? react : {}).test; } } }, console, Date, AbortSignal });
const t = (key, values) => api.translate("zh", key, values);
const render = (component, props) => { cursor = 0; return component(props); };
const nodes = (tree) => !tree || typeof tree !== "object" ? [] : [tree, ...tree.children.flatMap(nodes)];
const text = (tree) => typeof tree === "string" ? tree : typeof tree === "object" && tree ? tree.children.map(text).join(" ") : "";
const button = (tree, label) => nodes(tree).find((node) => node.type === "button" && text(node) === label);
const target = { installInfo: { method: "pnpm" }, item: { version: "0.1.5-rc.3", type: "rc" }, source: "npm" };
let confirmed;
let tree = render(api.UpdateConfirmModal, { target, t, onConfirm: (value) => { confirmed = value; } });
assert.equal(nodes(tree).find((node) => node.props.type === "checkbox").props.checked, true);
assert.equal(button(tree, t("settings.confirmUpdate")).props.disabled, true);
nodes(tree).find((node) => node.props.type === "checkbox").props.onChange({ target: { checked: false } });
tree = render(api.UpdateConfirmModal, { target, t, onConfirm: (value) => { confirmed = value; } });
assert.match(text(tree), /本次更新无法使用本次备份回滚/);
button(tree, t("settings.confirmUpdate")).props.onClick();
assert.equal(confirmed.enabled, false);
states = [true, "D:\\DSH backups", false, ""];
tree = render(api.UpdateConfirmModal, { target, t, onConfirm: (value) => { confirmed = value; } });
button(tree, t("settings.confirmUpdate")).props.onClick();
assert.equal(confirmed.directory, "D:\\DSH backups");
assert.equal(confirmed.enabled, true);
tree = api.UpdateOutputPanel({ state: { job: { status: "error", version: "0.1.5-rc.3", backup: { phase: "copying", progress: 26 }, actions: ["retry-backup"], steps: [], lines: [] } }, t, onAction() {} });
assert.ok(button(tree, t("settings.retryBackup")));
assert.equal(button(tree, t("settings.rollback")), undefined);
assert.doesNotMatch(text(tree), /正在处理|等待命令输出|请选择自动修复或一键回滚/);
assert.equal(nodes(tree).filter((node) => node.type === "progress").length, 0);
tree = api.UpdateOutputPanel({ state: { job: { status: "error", version: "0.1.5-rc.3", actions: ["verify"], steps: [], lines: [] } }, t, onAction() {} });
assert.ok(button(tree, t("settings.retryVerification")));
tree = api.UpdateOutputPanel({ state: { job: { status: "success", action: "verify", version: "0.1.5-rc.3", restartRequired: false, steps: [], lines: [] } }, t, onAction() {} });
assert.match(text(tree), /安装和 Web profile 验证通过/);
assert.doesNotMatch(text(tree), new RegExp(t("settings.restart")));
states = [null, [], false, "signal timed out", false];
tree = render(api.BackupManager, { t });
assert.match(text(tree), /signal timed out/);
assert.doesNotMatch(text(tree), /未找到插件备份/);
states = [{ backups: [{ id: "one", status: "failed", path: "D:\\backups\\one", sizeBytes: 2048 }, { id: "two", status: "running", path: "D:\\backups\\two", sizeBytes: 1024, inUse: true }] }, ["one", "two"], false, "", false];
tree = render(api.BackupManager, { t });
assert.match(text(tree), /已选 1 份 · 2.00 KiB/);
assert.equal(nodes(tree).filter((node) => node.props.type === "checkbox" && node.props.disabled).length, 1);
assert.equal(api.formatBytes(0), "0 B");
assert.equal(api.formatBytes(1024 ** 3), "1.00 GiB");
console.log("Backup UI checks passed: options, skip warning, failed-state output, retry capabilities, sizes and protected selections.");
