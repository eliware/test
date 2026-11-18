import { win32 } from "node:path";
function hasWindowsNpmCommandOnPath(searchPath, fileExists) {
  if (typeof searchPath !== "string" || typeof fileExists !== "function") return false;
  return [...windowsPathDirectories(searchPath)].some((directory) =>
    fileExists(win32.join(directory, "npm.cmd")),
  );
}
function* windowsPathDirectories(searchPath) {
  for (const entry of searchPath.split(win32.delimiter)) {
    yield entry
      .trim()
      .replace(/^"([^"]+)"([\\/]+)?$/u, "$1$2")
      .replace(/^"(.*)"$/u, "$1");
  }
}
export default hasWindowsNpmCommandOnPath;
