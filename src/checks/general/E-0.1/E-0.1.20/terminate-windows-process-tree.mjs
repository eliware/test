import { execFileSync } from "node:child_process";
import { win32 } from "node:path";
import { isProcessRunning } from "./is-process-running.mjs";
import { waitForProcessExit } from "./wait-for-process-exit.mjs";

function resolveWindowsExecutable(env, ...parts) {
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

export function resolveTaskkillExecutable(env = process.env) {
  return resolveWindowsExecutable(env, "System32", "taskkill.exe");
}

function terminateWithPowerShell(pid, env, execute, options) {
  const script =
    "$ErrorActionPreference='Stop'; $root=[int]$env:ELIWARE_TEST_PROCESS_ID; " +
    "$all=@(Get-CimInstance Win32_Process); $known=[Collections.Generic.HashSet[int]]::new(); " +
    "$descendants=[Collections.Generic.List[int]]::new(); [void]$known.Add($root); do { $changed=$false; " +
    "foreach($process in $all) { if($known.Contains([int]$process.ParentProcessId) -and " +
    "$known.Add([int]$process.ProcessId)) { $descendants.Add([int]$process.ProcessId); $changed=$true } } " +
    "} while($changed); for($index=$descendants.Count-1; $index -ge 0; $index--) { " +
    "Stop-Process -Id $descendants[$index] -Force -ErrorAction SilentlyContinue }; " +
    "Stop-Process -Id $root -Force -ErrorAction SilentlyContinue";
  const args = ["-NoProfile", "-NonInteractive", "-Command", script];
  const commandOptions = {
    ...options,
    env: { ...env, ELIWARE_TEST_PROCESS_ID: String(pid) },
  };
  try {
    execute(
      resolveWindowsExecutable(env, "System32", "WindowsPowerShell", "v1.0", "powershell.exe"),
      args,
      commandOptions,
    );
  } catch (powershellError) {
    try {
      execute("pwsh.exe", args, commandOptions);
    } catch (pwshError) {
      throw new AggregateError([powershellError, pwshError], "PowerShell fallbacks failed.");
    }
  }
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
      terminateWithPowerShell(pid, env, execute, options);
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
