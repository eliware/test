import { existsSync } from "node:fs";
import { isAbsolute, resolve, win32 } from "node:path";
import {
  hasWindowsNpmCommandOnPath,
  resolveWindowsNpmCliFromPath,
} from "./resolve-windows-npm-cli-from-path.mjs";

export function npmCommand(
  platform = process.platform,
  npmExecPath = process.env.npm_execpath,
  execPath = process.execPath,
  fileExists = existsSync,
  workingDirectory = process.cwd(),
  searchPath = process.env.PATH,
) {
  if (platform === "win32") {
    // codescope ignore: drive-rooted Windows paths with forward slashes are handled by isAbsoluteWindowsNpmPath below.
    if (typeof npmExecPath === "string" && npmExecPath.startsWith("//"))
      throw new Error("Cannot resolve a POSIX-style npm_execpath on Windows.");
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
    // codescope ignore: probe the adjacent CLI before selecting it, then fall back to PATH when it is absent
    if (fileExists(npmCli)) return [execPath, [npmCli]];
    const pathNpmCli = resolveWindowsNpmCliFromPath(searchPath, fileExists);
    if (pathNpmCli) return [execPath, [pathNpmCli]];
    const hasNpmCommand = hasWindowsNpmCommandOnPath(searchPath, fileExists);
    if (hasNpmCommand)
      throw new Error(
        "Windows PATH contains npm.cmd without an adjacent npm-cli.js; provide npm_execpath or install npm with its CLI beside the command.",
      );
    throw new Error(
      "Unable to resolve the npm CLI on Windows from npm_execpath, beside Node.js, or on PATH.",
    );
  }
  // codescope ignore: Windows drive and UNC npm_execpath values fall back to PATH before POSIX path resolution.
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
