import { win32 } from "node:path";
export default function parseWindowsPathDirectories(searchPath) {
  return searchPath.split(win32.delimiter).map((entry) =>
    entry
      .trim()
      .replace(/^"([^"]+)"([\\/]+)?$/u, "$1$2")
      .replace(/^"(.*)"$/u, "$1"),
  );
}
