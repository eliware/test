import { existsSync } from "node:fs";
import { isAbsolute, resolve, win32 } from "node:path";

export function npmCommand(
  platform = process.platform,
  npmExecPath = process.env.npm_execpath,
  execPath = process.execPath,
  fileExists = existsSync,
  workingDirectory = process.cwd(),
) {
  if (platform === "win32") {
    if (typeof npmExecPath === "string" && npmExecPath.trim()) {
      const resolvedNpmExecPath = isAbsoluteWindowsNpmPath(npmExecPath)
        ? npmExecPath
        : win32.resolve(workingDirectory, npmExecPath);
      if (fileExists(resolvedNpmExecPath)) return [execPath, [resolvedNpmExecPath]];
    }
    const npmCli = win32.join(win32.dirname(execPath), "node_modules", "npm", "bin", "npm-cli.js");
    if (fileExists(npmCli)) return [execPath, [npmCli]];
    throw new Error(
      "Unable to resolve the npm CLI on Windows; npm_execpath is unset and npm is not installed beside Node.js.",
    );
  }
  if (npmExecPath) {
    const resolvedNpmExecPath =
      isAbsolute(npmExecPath) || isAbsoluteWindowsNpmPath(npmExecPath)
        ? npmExecPath
        : resolve(workingDirectory, npmExecPath);
    return [execPath, [resolvedNpmExecPath]];
  }
  return ["npm", []];
}

function isAbsoluteWindowsNpmPath(path) {
  if (typeof path !== "string" || !win32.isAbsolute(path)) return false;
  const normalized = path.replaceAll("\\", "/");
  return (
    /^[A-Za-z]:\//u.test(normalized) || /^\/\/(?![.?]\/)[^/]+\/[^/]+(?:\/|$)/u.test(normalized)
  );
}
