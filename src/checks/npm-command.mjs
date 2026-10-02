import { existsSync } from "node:fs";
import { isAbsolute, resolve, win32 } from "node:path";
import { resolveWindowsNpmCliFromPath } from "./resolve-windows-npm-cli-from-path.mjs";

export function npmCommand(
  platform = process.platform,
  npmExecPath = process.env.npm_execpath,
  execPath = process.execPath,
  fileExists = existsSync,
  workingDirectory = process.cwd(),
  searchPath = process.env.PATH,
) {
  if (platform === "win32") {
    if (typeof npmExecPath === "string" && npmExecPath.trim()) {
      if (isPosixAbsolutePath(workingDirectory)) {
        throw new Error("Cannot resolve npm_execpath from a POSIX-style directory on Windows.");
      }
      const resolvedNpmExecPath = isAbsoluteWindowsNpmPath(npmExecPath)
        ? npmExecPath
        : win32.resolve(workingDirectory, npmExecPath);
      if (fileExists(resolvedNpmExecPath)) return [execPath, [resolvedNpmExecPath]];
    }
    const npmCli = win32.join(win32.dirname(execPath), "node_modules", "npm", "bin", "npm-cli.js");
    if (fileExists(npmCli)) return [execPath, [npmCli]];
    const pathNpmCli = resolveWindowsNpmCliFromPath(searchPath, fileExists);
    if (pathNpmCli) return [execPath, [pathNpmCli]];
    throw new Error(
      "Unable to resolve the npm CLI on Windows from npm_execpath, beside Node.js, or on PATH.",
    );
  }
  if (isAbsoluteWindowsNpmPath(npmExecPath)) return ["npm", []];
  if (npmExecPath) {
    const resolvedNpmExecPath = isAbsolute(npmExecPath)
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

function isPosixAbsolutePath(path) {
  return typeof path === "string" && path.startsWith("/") && !path.startsWith("//");
}
