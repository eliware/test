import { execFileSync } from "node:child_process";
import { win32 } from "node:path";

function resolveWindowsExecutable(env, ...parts) {
  const systemRoot = env?.SystemRoot;
  if (
    typeof systemRoot !== "string" ||
    !win32.isAbsolute(systemRoot) ||
    systemRoot.split(/[\\/]+/u).some((part) => part === "." || part === "..")
  ) {
    throw new Error("Windows process-tree termination requires an absolute SystemRoot path.");
  }
  return win32.resolve(systemRoot, ...parts);
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
