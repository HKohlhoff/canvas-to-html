import assert from "node:assert/strict";
import vm from "node:vm";
import { buildBrowserSearch } from "../src/render/browser-search";

const timers: Array<() => void> = [];
const doc: { activeElement: Control | null; body?: Control; documentElement?: Control } = { activeElement: null };
class Control {
  disabled = false;
  tabIndex = 0;
  isConnected = true;
  visible = true;
  value = "";
  lastFocusOptions: unknown;
  classList = { add() {}, remove() {} };
  setAttribute() {}
  getClientRects() { return this.visible ? [{}] : []; }
  focus(options?: unknown) { doc.activeElement = this; this.lastFocusOptions = options; }
}
const opener = new Control(), toolbar = new Control(), close = new Control(), input = new Control();
let controls = [close, input];
const overlay = { hidden: true, querySelectorAll: () => controls };
const context = {
  HTMLElement: Control, document: doc, searchOverlay: overlay, searchInput: input,
  searchToolbarButton: toolbar, searchResults: null, searchSummary: null, searchEntries: [],
  window: { setTimeout: (callback: () => void) => timers.push(callback) },
};
vm.createContext(context);
vm.runInContext(buildBrowserSearch(), context);
const api = context as typeof context & {
  openSearch(): void;
  closeSearch(): void;
  trapSearchFocus(event: { key: string; shiftKey: boolean; preventDefault(): void }): boolean;
};
function tab(shiftKey = false) {
  let prevented = false;
  const handled = api.trapSearchFocus({ key: "Tab", shiftKey, preventDefault: () => { prevented = true; } });
  return { handled, prevented };
}
opener.focus();
api.openSearch();
assert.equal(overlay.hidden, false);
timers.splice(0).forEach((run) => run());
assert.equal(doc.activeElement, input);
assert.deepEqual(tab(), { handled: true, prevented: true });
assert.equal(doc.activeElement, close);
assert.deepEqual(tab(true), { handled: true, prevented: true });
assert.equal(doc.activeElement, input);
close.focus();
assert.equal(tab().prevented, false, "native Tab handles intermediate controls");
const resultLink = new Control(), resultButton = new Control(), disabled = new Control(), hidden = new Control();
disabled.disabled = true; hidden.visible = false;
controls = [close, input, resultLink, resultButton, disabled, hidden];
resultButton.focus();
assert.equal(tab().prevented, true);
assert.equal(doc.activeElement, close, "new results participate, disabled/hidden controls do not");
opener.focus();
assert.equal(tab(true).prevented, true);
assert.equal(doc.activeElement, resultButton, "Tab from outside returns to the modal");
api.openSearch(); // Must not overwrite the original return target.
api.closeSearch();
assert.equal(doc.activeElement, opener);
assert.equal((opener.lastFocusOptions as { preventScroll: boolean }).preventScroll, true);
assert.deepEqual(tab(), { handled: false, prevented: false });
timers.splice(0).forEach((run) => run());
assert.equal(doc.activeElement, opener, "late autofocus cannot steal focus after close");
api.openSearch();
opener.isConnected = false;
api.closeSearch();
assert.equal(doc.activeElement, toolbar, "removed opener falls back to the toolbar");
doc.body = new Control();
doc.body.focus();
api.openSearch();
api.closeSearch();
assert.equal(doc.activeElement, toolbar, "opening by keyboard from the body restores a usable toolbar target");
opener.isConnected = true;
opener.focus();
api.openSearch();
opener.disabled = true;
api.closeSearch();
assert.equal(doc.activeElement, toolbar, "disabled original control is not a return target");
console.log("PASS search traps forward/backward Tab, includes dynamic results and restores focus without late autofocus");
