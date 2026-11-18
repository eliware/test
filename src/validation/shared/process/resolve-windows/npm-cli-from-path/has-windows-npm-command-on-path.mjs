import { win32 } from "node:path";
import parseWindowsPathDirectories from "./path-directories.mjs";
function hasWindowsNpmCommandOnPath(searchPath, fileExists) {
  if (typeof searchPath !== "string" || typeof fileExists !== "function") return false;
  return parseWindowsPathDirectories(searchPath).some((directory) =>
    fileExists(win32.join(directory, "npm.cmd")),
  );
}
export default hasWindowsNpmCommandOnPath;
