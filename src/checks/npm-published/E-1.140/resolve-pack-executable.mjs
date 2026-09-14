export function resolvePackExecutable(env = process.env, platform = process.platform, execPath = process.execPath) {
  return env.npm_execpath
    ? [execPath, [env.npm_execpath]]
    : [platform === "win32" ? "npm.cmd" : "npm", []];
}
