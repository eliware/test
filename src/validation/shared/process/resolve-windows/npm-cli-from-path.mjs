import { win32 } from "node:path";
import parseWindowsPathDirectories from "./npm-cli-from-path/path-directories.mjs";
export default function resolveWindowsNpmCliFromPath(searchPath, fileExists) {
  if (typeof searchPath !== "string" || typeof fileExists !== "function") return undefined;
  for (const directory of parseWindowsPathDirectories(searchPath)) {
    if (!directory) continue;
    const command = win32.join(directory, "npm.cmd");
    const cli = win32.join(directory, "node_modules", "npm", "bin", "npm-cli.js");
    if (fileExists(command) && fileExists(cli)) return cli;
  }
  return undefined;
}
