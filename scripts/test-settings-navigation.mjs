import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../client/client.js", import.meta.url), "utf8");
const start = source.indexOf("function openSettingsSection(label) {");
const end = source.indexOf("\n\t\tfunction VersionCard(", start);
assert.notEqual(start, -1, "settings navigation handler exists");
assert.notEqual(end, -1, "settings navigation handler has a clear boundary");
const openSettingsSection = new Function(
	"document",
	"window",
	`${source.slice(start, end)}; return openSettingsSection;`,
);

function runNavigation({ mode, menuLabel = "Settings", shortcutText = "", shortcutAria = "", ariaLabel = null, existingDialog = false, menuInitiallyOpen = false, menuHasSettings = true, navLabel = "DSH Version Checker" }) {
	let menuOpen = menuInitiallyOpen;
	let dialogOpen = existingDialog || false;
	let triggerClicks = 0;
	let selected = 0;
	const navButton = {
		textContent: navLabel,
		click() { selected += 1; },
	};
	const panel = {
		querySelectorAll(selector) { return selector === "nav button" ? [navButton] : []; },
	};
	const menuItem = {
		// DSH renders adjacent label and aria-hidden shortcut spans, with no text separator.
		textContent: menuLabel + shortcutText,
		getAttribute(name) {
			if (name === "aria-label") return ariaLabel;
			if (name === "aria-keyshortcuts") return shortcutAria || null;
			return null;
		},
		cloneNode() {
			let shortcutRemoved = false;
			return {
				get textContent() { return menuLabel + (shortcutRemoved ? "" : shortcutText); },
				querySelectorAll(selector) {
					assert.equal(selector, '[aria-hidden="true"]');
					return shortcutText ? [{ remove() { shortcutRemoved = true; } }] : [];
				},
			};
		},
		click() { menuOpen = false; dialogOpen = true; },
	};
	const menu = {
		querySelectorAll(selector) {
			return menuHasSettings && /menuitem|button/.test(selector) ? [menuItem] : [];
		},
	};
	const trigger = {
		click() {
			triggerClicks += 1;
			if (mode === "menu") menuOpen = true;
			else dialogOpen = true;
		},
	};
	const sidebar = {
		querySelector() { return trigger; },
	};
	const document = {
		querySelector(selector) {
			if (selector === '[role="menu"]') return menuOpen ? menu : null;
			if (selector.startsWith('[data-pane="sidebar"]')) return sidebar;
			return null;
		},
		querySelectorAll(selector) {
			return selector === '[role="dialog"]' && dialogOpen ? [panel] : [];
		},
	};
	const window = { setTimeout(callback) { callback(); } };
	openSettingsSection(document, window)(() => "DSH Version Checker");
	return { selected, triggerClicks };
}

for (const menuLabel of ["Settings", "设置", "設定"]) {
	assert.deepEqual(runNavigation({ mode: "menu", menuLabel }), { selected: 1, triggerClicks: 1 });
	assert.deepEqual(runNavigation({ mode: "menu", menuLabel, shortcutText: "CtrlAlt,", shortcutAria: "Control+Alt+," }), { selected: 1, triggerClicks: 1 }, "adjacent shortcut text must not hide the Settings action");
	assert.deepEqual(runNavigation({ mode: "menu", menuLabel, shortcutText: "CtrlAlt," }), { selected: 1, triggerClicks: 1 }, "hidden shortcut text is excluded even without aria-keyshortcuts");
}
assert.deepEqual(runNavigation({ mode: "menu", menuLabel: "Feedback", shortcutText: "CtrlAlt,", shortcutAria: "Control+Alt+," }), { selected: 0, triggerClicks: 1 }, "a shortcut alone must not select an unrelated action");
assert.deepEqual(runNavigation({ mode: "menu", menuLabel: "Settings extension" }), { selected: 0, triggerClicks: 1 }, "partial labels must not select an unrelated action");
assert.deepEqual(runNavigation({ mode: "menu", menuLabel: "icon text", ariaLabel: "Settings" }), { selected: 1, triggerClicks: 1 });
assert.deepEqual(runNavigation({ mode: "menu", menuInitiallyOpen: true }), { selected: 1, triggerClicks: 0 });
assert.deepEqual(runNavigation({ mode: "dialog" }), { selected: 1, triggerClicks: 1 });
assert.deepEqual(runNavigation({ mode: "dialog", existingDialog: true }), { selected: 1, triggerClicks: 0 });
assert.deepEqual(runNavigation({ mode: "dialog", existingDialog: true, navLabel: "General" }), { selected: 0, triggerClicks: 0 });
assert.deepEqual(runNavigation({ mode: "menu", menuHasSettings: false }), { selected: 0, triggerClicks: 1 });
assert.deepEqual(runNavigation({ mode: "menu", menuInitiallyOpen: true, menuHasSettings: false }), { selected: 0, triggerClicks: 0 });

console.log("Settings navigation paths passed.");
