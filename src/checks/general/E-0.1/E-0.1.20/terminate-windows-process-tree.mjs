import { execFileSync } from "node:child_process";
import { win32 } from "node:path";

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

export function createWindowsProcessTreeKiller(executeProcess = execFileSync) {
  return function killWindowsProcessTree(pid, env = process.env, execute = executeProcess) {
    const options = { windowsHide: true, stdio: "ignore", timeout: 1_000, shell: false };
    try {
      execute(resolveTaskkillExecutable(env), ["/pid", String(pid), "/t", "/f"], options);
    } catch (taskkillError) {
      const powershell = resolveWindowsExecutable(
        env,
        "System32",
        "WindowsPowerShell",
        "v1.0",
        "powershell.exe",
      );
      const script =
        "$ErrorActionPreference='Stop'; $root=[int]$env:ELIWARE_TEST_PROCESS_ID; " +
        "$all=@(Get-CimInstance Win32_Process); $known=[Collections.Generic.HashSet[int]]::new(); " +
        "$descendants=[Collections.Generic.List[int]]::new(); [void]$known.Add($root); do { $changed=$false; " +
        "foreach($process in $all) { if($known.Contains([int]$process.ParentProcessId) -and " +
        "$known.Add([int]$process.ProcessId)) { $descendants.Add([int]$process.ProcessId); $changed=$true } } " +
        "} while($changed); for($index=$descendants.Count-1; $index -ge 0; $index--) { " +
        "Stop-Process -Id $descendants[$index] -Force -ErrorAction SilentlyContinue }; " +
        "Stop-Process -Id $root -Force -ErrorAction SilentlyContinue";
      try {
        execute(powershell, ["-NoProfile", "-NonInteractive", "-Command", script], {
          ...options,
          timeout: 1_000,
          env: { ...env, ELIWARE_TEST_PROCESS_ID: String(pid) },
        });
      } catch (powershellError) {
        throw new AggregateError(
          [taskkillError, powershellError],
          "Windows process-tree termination failed.",
        );
      }
    }
  };
}

export const killWindowsProcessTree = createWindowsProcessTreeKiller();
