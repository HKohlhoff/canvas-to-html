import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CURRENT_RELEASE_NOTES_ID,
  CURRENT_RELEASE_NOTES_MARKDOWN,
} from "../src/release-notes-content";

const manifest = JSON.parse(readFileSync("manifest.json", "utf8")) as {
  version: string;
};
const expectedReleaseNoteId = `release-${manifest.version}`;
const releaseNoteVersion = expectedReleaseNoteId.replace(/^release-/, "");
assert.equal(CURRENT_RELEASE_NOTES_ID, expectedReleaseNoteId);
assert.ok(
  CURRENT_RELEASE_NOTES_MARKDOWN.includes(
    `Canvas HTML Exporter ${releaseNoteVersion}`,
  ),
);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /More reliable exports/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Text nodes/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Recursive section embeds/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /PDFs/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Windows drive roots/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /export the original Canvas again/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Tab and Shift\+Tab/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /marked as read\s+only after you close/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /source .*\.canvas.* file\s+is not modified/);
assert.doesNotMatch(CURRENT_RELEASE_NOTES_MARKDOWN, /API v1/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /leaves no note or other content file in your Vault/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Show last update/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /buy me a coffee on\s+Ko-fi/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /https:\/\/ko-fi\.com\/hokdev/);
assert.equal(
  readFileSync("Last Update.md", "utf8").trim(),
  CURRENT_RELEASE_NOTES_MARKDOWN.trim(),
);
console.log("PASS keeps the transient update note and repository Markdown synchronized");
