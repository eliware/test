import { execFileSync } from "node:child_process";
import { join } from "node:path";

export function resolveTaskkillExecutable(env = process.env) {
  if (!env.SystemRoot) throw new Error("Windows process-tree termination requires SystemRoot.");
  return join(env.SystemRoot, "System32", "taskkill.exe");
}

function defaultKillTree(pid, env) {
  killWindowsProcessTree(pid, env);
}

export function killWindowsProcessTree(pid, env = process.env, execute = execFileSync) {
  const options = { windowsHide: true, stdio: "ignore", timeout: 1_000 };
  try {
    execute(resolveTaskkillExecutable(env), ["/pid", String(pid), "/t", "/f"], options);
  } catch (taskkillError) {
    const powershell = join(env.SystemRoot, "System32", "WindowsPowerShell", "v1.0", "powershell.exe");
    const script = "$ErrorActionPreference='Stop'; $root=[int]$env:ELIWARE_TEST_PROCESS_ID; " +
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
        env: { ...env, ELIWARE_TEST_PROCESS_ID: String(pid) },
      });
    } catch (powershellError) {
      throw new AggregateError([taskkillError, powershellError], "Windows process-tree termination failed.");
    }
  }
}

export function terminateChild(
  child,
  platform = process.platform,
  killProcess = process.kill,
  killTree = defaultKillTree,
  env = process.env,
  signal = "SIGTERM",
) {
  if (!child || typeof child.kill !== "function") return false;
  if (platform === "win32") {
    if (Number.isInteger(child.pid) && child.pid > 0) {
      try {
        killTree(child.pid, env);
        return true;
      } catch {
        try { child.kill(signal); } catch {}
        return false;
      }
    }
    try {
      child.kill(signal);
    } catch {
      // The child cannot be safely addressed without its process-tree identifier.
    }
    return false;
  }
  if (Number.isInteger(child.pid) && child.pid > 0) {
    try {
      killProcess(-child.pid, signal);
      return true;
    } catch {}
  }
  try {
    child.kill(signal);
  } catch {
    return false;
  }
  return true;
}
