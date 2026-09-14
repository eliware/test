import { dirname, join } from "node:path";

export function selectNpmCommand({ env = process.env, platform = process.platform, execPath = process.execPath } = {}) {
  if (env.npm_execpath) return [execPath, [env.npm_execpath]];
  if (platform === "win32") {
    return [execPath, [join(dirname(execPath), "node_modules", "npm", "bin", "npm-cli.js")]];
  }
  return ["npm", []];
}
