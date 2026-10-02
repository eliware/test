import { win32 } from "node:path";

export function resolveWindowsSystemExecutable(env, ...parts) {
  const configuredSystemRoot = [env?.SystemRoot, env?.WINDIR].find(
    (path) => typeof path === "string" && path.length > 0,
  );
  const systemRoot =
    configuredSystemRoot ??
    [process.env.SystemRoot, process.env.WINDIR].find(isAbsoluteWindowsPath);
  if (
    !isAbsoluteWindowsPath(systemRoot) ||
    systemRoot.split(/[\\/]+/u).some((part) => part === "." || part === "..")
  ) {
    throw new Error("Windows process-tree termination requires an absolute SystemRoot path.");
  }
  const normalizedRoot = win32.resolve(win32.normalize(systemRoot));
  return win32.resolve(normalizedRoot, ...parts);
}

function isAbsoluteWindowsPath(path) {
  const normalized = typeof path === "string" ? path.replaceAll("/", "\\") : "";
  const hasDriveRoot = /^[A-Za-z]:\\/u.test(normalized);
  const unc = /^\\\\([^\\]+)\\([^\\]+)(?:\\|$)/u.exec(normalized);
  const hasUncRoot = Boolean(unc && ![".", "?"].includes(unc[1]) && unc[2] !== ".");
  return (
    (hasDriveRoot || hasUncRoot) &&
    !normalized.split(/\\+/u).some((part) => part === "." || part === "..")
  );
}
