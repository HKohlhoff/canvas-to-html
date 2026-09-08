import assert from "node:assert/strict";
import { isAbsoluteFilesystemPath, normalizeStoredOutputPathValue } from "../src/helpers/desktop-paths";

assert.equal(normalizeStoredOutputPathValue("."), ".");
assert.equal(normalizeStoredOutputPathValue("C:/"), "C:/");
assert.equal(normalizeStoredOutputPathValue("C:\\"), "C:/");
assert.ok(isAbsoluteFilesystemPath(String.raw`\\server\share\exports`));
assert.equal(normalizeStoredOutputPathValue(String.raw`\\server\share\exports`), "//server/share/exports");
assert.equal(normalizeStoredOutputPathValue("//server/share/exports/"), "//server/share/exports");
console.log("PASS preserves vault, drive and UNC output roots");
