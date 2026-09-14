export function npmCommand(platform = process.platform, npmExecPath = process.env.npm_execpath) {
  return npmExecPath ? [process.execPath, [npmExecPath]] : [platform === "win32" ? "npm.cmd" : "npm", []];
}
