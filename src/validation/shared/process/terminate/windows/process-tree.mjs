import { execFileSync } from "node:child_process";
import { isProcessRunning } from "../../is-process-running.mjs";
import { waitForProcessExit } from "../../wait-for-process-exit.mjs";
import { resolveWindowsPowerShellCoreExecutable } from "../../resolve-windows/powershell-core-executable.mjs";
import { attemptWindowsProcessTreeFallbacks } from "./fallback.mjs";

export function createWindowsProcessTreeKiller(
  executeProcess = execFileSync,
  processIsRunning = isProcessRunning,
  waitForExit = (pid) => waitForProcessExit(pid, processIsRunning),
  resolvePowerShellCore = resolveWindowsPowerShellCoreExecutable,
) {
  return function killWindowsProcessTree(pid, env = process.env, execute = executeProcess) {
    if (!processIsRunning(pid)) return;
    const options = { windowsHide: true, stdio: "ignore", timeout: 1_000, shell: false };
    const fallbackError = attemptWindowsProcessTreeFallbacks(
      pid,
      env,
      execute,
      options,
      waitForExit,
      resolvePowerShellCore,
    );
    if (waitForExit(pid)) return;
    if (fallbackError) throw fallbackError;
    throw new Error("Windows process remains running after process-tree termination.");
  };
}

export const killWindowsProcessTree = createWindowsProcessTreeKiller();
