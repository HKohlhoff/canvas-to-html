import { setTimeout as setTestTimeout, clearTimeout as clearTestTimeout } from "node:timers";
import assert from "node:assert/strict";
import { pickDirectoryFromInput } from "../src/helpers/folder-input";

class Input extends EventTarget {
  type = "";
  webkitdirectory = false;
  multiple = false;
  files: Array<{ path?: string }> = [];
  clickCount = 0;
  listeners = new Set<string>();
  click() { this.clickCount++; }
  override addEventListener(type: string, callback: EventListenerOrEventListenerObject | null) {
    this.listeners.add(type);
    super.addEventListener(type, callback);
  }
  override removeEventListener(type: string, callback: EventListenerOrEventListenerObject | null) {
    this.listeners.delete(type);
    super.removeEventListener(type, callback);
  }
}
(async () => {
  for (const scenario of [
    { event: "cancel", files: [], expected: null },
    { event: "change", files: [], expected: null },
    { event: "change", files: [{}], expected: null },
    { event: "change", files: [{ path: "/tmp/chosen/file.txt" }], expected: "/tmp/chosen" },
    { event: "change", files: [{ path: String.raw`C:\chosen\file.txt` }], expected: "C:/chosen" },
  ]) {
    const input = new Input();
    input.files = scenario.files;
    const result = pickDirectoryFromInput(input as unknown as HTMLInputElement);
    assert.equal(input.clickCount, 1);
    assert.ok(input.webkitdirectory && input.multiple);
    input.dispatchEvent(new Event(scenario.event));
    const timeout = setTestTimeout(() => { throw new Error("Picker did not settle"); }, 1000);
    try { assert.equal(await result, scenario.expected); } finally { clearTestTimeout(timeout); }
    assert.equal(input.listeners.size, 0, "all completion paths remove both handlers");
  }
  const failing = new Input();
  failing.click = () => { throw new Error("picker unavailable"); };
  await assert.rejects(pickDirectoryFromInput(failing as unknown as HTMLInputElement), /picker unavailable/);
  assert.equal(failing.listeners.size, 0);
  console.log("PASS folder fallback settles on cancel, empty/change selection and click failure, cleaning up handlers");
})().catch((error) => { console.error(error); process.exitCode = 1; });
