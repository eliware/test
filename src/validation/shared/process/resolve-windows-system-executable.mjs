import { win32 } from "node:path";

export function resolveWindowsSystemExecutable(env, ...parts) {
  const systemRoot = [
    env?.SystemRoot,
    env?.WINDIR,
    process.env.SystemRoot,
    process.env.WINDIR,
  ].find(isAbsoluteWindowsPath);
  if (!systemRoot) {
    throw new Error("Windows process-tree termination requires an absolute SystemRoot path.");
  }
  const normalizedRoot = win32.resolve(win32.normalize(systemRoot));
  return win32.resolve(normalizedRoot, ...parts);
}

function isAbsoluteWindowsPath(path) {
  const normalized = typeof path === "string" ? path.replaceAll("/", "\\") : "";
  const hasDriveRoot = /^[A-Za-z]:\\/u.test(normalized);
  return hasDriveRoot && !normalized.split(/\\+/u).some((part) => part === "." || part === "..");
}
