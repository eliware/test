import { execFileSync } from "node:child_process";
import { isProcessRunning } from "./is-process-running.mjs";
import { waitForProcessExit } from "./wait-for-process-exit.mjs";
import { resolveWindowsSystemExecutable } from "./resolve-windows-system-executable.mjs";
import { runWindowsProcessTreeFallback } from "./run-windows-process-tree-fallback.mjs";

export function resolveTaskkillExecutable(env = process.env) {
  return resolveWindowsSystemExecutable(env, "System32", "taskkill.exe");
}

export function createWindowsProcessTreeKiller(
  executeProcess = execFileSync,
  processIsRunning = isProcessRunning,
  waitForExit = (pid) => waitForProcessExit(pid, processIsRunning),
) {
  return function killWindowsProcessTree(pid, env = process.env, execute = executeProcess) {
    if (!processIsRunning(pid)) return;
    const options = { windowsHide: true, stdio: "ignore", timeout: 1_000, shell: false };
    let taskkillError;
    try {
      execute(resolveTaskkillExecutable(env), ["/pid", String(pid), "/t", "/f"], options);
    } catch (error) {
      taskkillError = error;
    }
    if (waitForExit(pid)) return;
    let powershellError;
    try {
      runWindowsProcessTreeFallback(pid, env, execute, options);
    } catch (error) {
      powershellError = error;
    }
    if (waitForExit(pid)) return;
    const failures = [taskkillError, powershellError].filter(Boolean);
    if (failures.length)
      throw new AggregateError(failures, "Windows process-tree termination failed.");
    throw new Error("Windows process remains running after process-tree termination.");
  };
}

export const killWindowsProcessTree = createWindowsProcessTreeKiller();
