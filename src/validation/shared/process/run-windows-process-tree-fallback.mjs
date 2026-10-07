import { resolveWindowsSystemExecutable } from "./resolve-windows-system-executable.mjs";
import { resolveWindowsPowerShellCoreExecutable } from "./resolve-windows-powershell-core-executable.mjs";

export function runWindowsProcessTreeFallback(
  pid,
  env,
  execute,
  options,
  resolvePowerShellCore = resolveWindowsPowerShellCoreExecutable,
) {
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
  const commandOptions = { ...options, env: { ...env, ELIWARE_TEST_PROCESS_ID: String(pid) } };
  try {
    execute(
      resolveWindowsSystemExecutable(
        env,
        "System32",
        "WindowsPowerShell",
        "v1.0",
        "powershell.exe",
      ),
      args,
      commandOptions,
    );
  } catch (powershellError) {
    try {
      execute(resolvePowerShellCore(env), args, commandOptions);
    } catch (pwshError) {
      throw new AggregateError([powershellError, pwshError], "PowerShell fallbacks failed.");
    }
  }
}
