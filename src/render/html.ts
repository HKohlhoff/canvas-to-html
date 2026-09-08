export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function escapeAttribute(text: string): string {
  return escapeHtml(text).replace(/`/g, "&#96;");
}

export function serializeScriptData(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
