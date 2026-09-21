import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

export function npmCommand(platform = process.platform, npmExecPath = process.env.npm_execpath, execPath = process.execPath, fileExists = existsSync) {
  if (npmExecPath) return [execPath, [npmExecPath]];
  if (platform === "win32") {
    const npmCli = join(dirname(execPath), "node_modules", "npm", "bin", "npm-cli.js");
    if (fileExists(npmCli)) return [execPath, [npmCli]];
  }
  return [platform === "win32" ? "npm.cmd" : "npm", []];
}
