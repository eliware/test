import { win32 } from "node:path";

export function resolveWindowsNpmCliFromPath(searchPath, fileExists) {
  if (typeof searchPath !== "string" || typeof fileExists !== "function") return undefined;
  for (const entry of searchPath.split(win32.delimiter)) {
    const directory = entry
      .trim()
      .replace(/^"([^"]+)"([\\/]+)?$/u, "$1$2")
      .replace(/^"(.*)"$/u, "$1");
    if (!directory) continue;
    // codescope ignore: the process runner invokes Node directly and cannot execute a npm.cmd wrapper without a shell; require its npm-cli.js target
    const command = win32.join(directory, "npm.cmd");
    const cli = win32.join(directory, "node_modules", "npm", "bin", "npm-cli.js");
    if (fileExists(command) && fileExists(cli)) return cli;
  }
  return undefined;
}
