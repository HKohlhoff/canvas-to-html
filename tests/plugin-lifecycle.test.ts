import assert from "node:assert/strict";
import vm from "node:vm";
import { CURRENT_RELEASE_NOTES_ID } from "../src/release-notes-content";
import { buildSync } from "esbuild";

const bundle = buildSync({ entryPoints: ["src/main.ts"], bundle: true, write: false, platform: "node", format: "cjs", external: ["obsidian"], loader: { ".md": "text" }, logLevel: "silent" }).outputFiles[0].text;
type RuntimePlugin = {
  onload(): Promise<void>;
  exportCurrentCanvas(): Promise<void>;
  onunload(): void;
  saveSettings(): Promise<void>;
  saveData(data: unknown): Promise<void>;
  showLastUpdate(): void;
  showReadme(): void;
  settings: { outputDir: string };
};
function fixture(saved: unknown = {}, layoutReady = false) {
  let ready = () => {};
  const modals = new Set<MockModal>();
  const writes: unknown[] = [];
  const notices: string[] = [];
  const vault = { read: async () => "" };
  let activeFile: unknown = null;
  const element = (): Record<string, unknown> => ({ addClass() {}, empty() {}, setText() {}, createDiv: element, createEl: element, addEventListener() {} });
  class MockModal {
    contentEl = element();
    modalEl = element();
    app = {};
    setTitle() {}
    onOpen() {}
    onClose() {}
    open() { modals.add(this); this.onOpen(); }
    close() { if (modals.delete(this)) this.onClose(); }
  }
  class MockPlugin {
    app = { vault, workspace: { getActiveFile: () => activeFile, onLayoutReady: (callback: () => void) => { ready = callback; if (layoutReady) callback(); } } };
    async loadData() { return saved; }
    async saveData(data: unknown) { writes.push(data); }
    addRibbonIcon() {}
    addCommand() {}
    addSettingTab() {}
  }
  const obsidian = {
    Plugin: MockPlugin, Modal: MockModal, PluginSettingTab: class {}, FuzzySuggestModal: class {}, Notice: class { constructor(message: string) { notices.push(message); } }, TFile: class {}, TFolder: class {},
    Component: class { load() {} unload() {} },
    MarkdownRenderer: { render: () => Promise.resolve() },
  };
  const context = { module: { exports: {} as { default: new () => RuntimePlugin } }, require: (name: string) => { assert.equal(name, "obsidian"); return obsidian; }, console, setTimeout, clearTimeout, TextEncoder, TextDecoder };
  vm.runInNewContext(bundle, context);
  return { plugin: new context.module.exports.default(), ready: () => ready(), writes, modals, notices, vault, setActiveFile: (file: unknown) => { activeFile = file; } };
}
const flush = async () => { for (let i = 0; i < 10; i++) await Promise.resolve(); };
(async () => {
  for (const previousId of ["release-1.3.0", "release-1.3.1"]) {
  for (const layoutReady of [false, true]) {
    const upgrade = fixture({ schemaVersion: 1, settings: { outputDir: "preserved" }, ui: { lastShownReleaseNotesId: previousId } }, layoutReady);
    await upgrade.plugin.onload();
    if (!layoutReady) {
      assert.equal(upgrade.modals.size, 0);
      upgrade.ready();
    }
    assert.equal(upgrade.plugin.settings.outputDir, "preserved");
    assert.equal(upgrade.modals.size, 1, "upgrade opens automatically regardless of layout timing");
    assert.equal(upgrade.writes.length, 0);
    upgrade.plugin.showLastUpdate();
    assert.equal(upgrade.modals.size, 1, "settings action reuses the pending update modal");
    [...upgrade.modals][0].close();
    await flush();
    assert.equal(upgrade.writes.length, 1);
    const saved = upgrade.writes[0] as { ui: { lastShownReleaseNotesId: string } };
    assert.equal(saved.ui.lastShownReleaseNotesId, CURRENT_RELEASE_NOTES_ID);
    const restart = fixture(saved, layoutReady);
    await restart.plugin.onload();
    restart.ready();
    assert.equal(restart.modals.size, 0, "same version stays read on restart");
    restart.plugin.showLastUpdate();
    assert.equal(restart.modals.size, 1, "settings can always reopen the note");
    restart.plugin.onunload();
  }
  }
  const exporting = fixture();
  await exporting.plugin.onload();
  exporting.setActiveFile({ path: "test.canvas", extension: "canvas", basename: "test" });
  let finishRead = (_value: string) => {};
  let reads = 0;
  exporting.vault.read = () => { reads++; return new Promise<string>((resolve) => { finishRead = resolve; }); };
  const exportTask = exporting.plugin.exportCurrentCanvas();
  await flush();
  await exporting.plugin.exportCurrentCanvas();
  assert.equal(reads, 1);
  assert.ok(exporting.notices.includes("A canvas export is already running."));
  finishRead("invalid JSON");
  await exportTask;
  const retry = exporting.plugin.exportCurrentCanvas();
  await flush();
  assert.equal(reads, 2, "failed export releases the concurrency guard");
  finishRead("invalid JSON");
  await retry;

  const unloaded = fixture();
  await unloaded.plugin.onload();
  unloaded.plugin.onunload();
  unloaded.ready();
  assert.equal(unloaded.modals.size, 0);

  const open = fixture();
  await open.plugin.onload();
  open.ready();
  assert.equal(open.modals.size, 1);
  assert.equal(open.writes.length, 0);
  open.plugin.showReadme();
  assert.equal(open.modals.size, 2);
  open.plugin.onunload();
  await flush();
  assert.equal(open.modals.size, 0);
  assert.equal(open.writes.length, 0, "unload must not persist an old instance's read marker");

  const closed = fixture();
  await closed.plugin.onload();
  closed.ready();
  [...closed.modals][0].close();
  await flush();
  assert.equal(closed.writes.length, 1);

  const concurrent = fixture();
  await concurrent.plugin.onload();
  const started: unknown[] = [];
  let finishFirst = () => {};
  concurrent.plugin.saveData = async (snapshot) => {
    started.push(snapshot);
    if (started.length === 1) await new Promise<void>((resolve) => { finishFirst = resolve; });
  };
  concurrent.plugin.settings.outputDir = "first";
  const first = concurrent.plugin.saveSettings();
  await flush();
  concurrent.plugin.settings.outputDir = "second";
  const second = concurrent.plugin.saveSettings();
  await flush();
  assert.equal(started.length, 1);
  assert.equal((started[0] as { settings: { outputDir: string } }).settings.outputDir, "first");
  finishFirst();
  await Promise.all([first, second]);
  assert.equal(started.length, 2);
  assert.equal((started[1] as { settings: { outputDir: string } }).settings.outputDir, "second");
  concurrent.plugin.saveData = () => Promise.reject(new Error("disk full"));
  await assert.rejects(concurrent.plugin.saveSettings(), /disk full/);
  concurrent.plugin.saveData = async () => {};
  await concurrent.plugin.saveSettings();

  const future = fixture({ schemaVersion: 99, settings: { outputDir: "future" } });
  await assert.rejects(future.plugin.onload(), /requires a newer/);
  assert.equal(future.writes.length, 0);
  console.log("PASS lifecycle cleanup, close-only read markers, ordered save snapshots and future schema protection");
})().catch((error) => { console.error(error); process.exitCode = 1; });
