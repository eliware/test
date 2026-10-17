import { resolveWindowsSystemExecutable } from "./system-executable.mjs";

export function resolveTaskkillExecutable(env = process.env) {
  return resolveWindowsSystemExecutable(env, "System32", "taskkill.exe");
}
