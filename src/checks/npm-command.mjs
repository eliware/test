import { existsSync } from "node:fs";
import { win32 } from "node:path";

export function npmCommand(
  platform = process.platform,
  npmExecPath = process.env.npm_execpath,
  execPath = process.execPath,
  fileExists = existsSync,
) {
  if (npmExecPath) return [execPath, [npmExecPath]];
  if (platform === "win32") {
    const npmCli = win32.join(win32.dirname(execPath), "node_modules", "npm", "bin", "npm-cli.js");
    if (fileExists(npmCli)) return [execPath, [npmCli]];
    throw new Error(
      "Unable to resolve the npm CLI on Windows; npm_execpath is unset and npm is not installed beside Node.js.",
    );
  }
  return ["npm", []];
}
