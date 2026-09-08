import { normalizeAbsoluteFolderPath } from "./desktop-paths";

/** Browser fallback used when Electron's directory dialog is unavailable. */
export function pickDirectoryFromInput(input: HTMLInputElement): Promise<string | null> {
  input.type = "file";
  input.webkitdirectory = true;
  input.multiple = true;

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      input.removeEventListener("change", onChange);
      input.removeEventListener("cancel", onCancel);
    };
    const finish = (path: string | null) => {
      cleanup();
      resolve(path);
    };
    const onChange = () => {
      const file: unknown = input.files?.[0];
      const selectedPath = file && typeof file === "object" && "path" in file && typeof file.path === "string"
        ? file.path : "";
      finish(selectedPath ? normalizeAbsoluteFolderPath(selectedPath.replace(/[/\\][^/\\]+$/, "")) : null);
    };
    const onCancel = () => finish(null);
    input.addEventListener("change", onChange);
    input.addEventListener("cancel", onCancel);
    try {
      input.click();
    } catch (error) {
      cleanup();
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}
