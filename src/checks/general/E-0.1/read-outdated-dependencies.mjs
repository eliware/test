import { spawn } from "node:child_process";
import { npmCommand } from "../../npm-command.mjs";
import { killWindowsProcessTree, terminateChild } from "./E-0.1.20/terminate-child.mjs";

const maxStdoutLength = 100_000;

export function readOutdatedDependencies(
  root,
  spawnProcess = spawn,
  {
    terminationGracePeriodMs = 1_000,
    env = process.env,
    platform = process.platform,
    execPath = process.execPath,
    terminateProcess = terminateChild,
    killProcess = process.kill,
    killTree = killWindowsProcessTree,
  } = {},
) {
  return new Promise((resolve, reject) => {
    const [npmExecutable, prefix] = npmCommand(platform, env.npm_execpath ?? "", execPath);
    const npmArgs = [...prefix, "outdated", "--json"];
    const child = spawnProcess(npmExecutable, npmArgs, {
      cwd: root,
      detached: platform !== "win32",
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...env, npm_config_loglevel: "error" },
    });
    let stdout = "";
    let stderr = "";
    let oversized = false;
    let settled = false;
    let terminationTimer;
    const rejectOnce = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(terminationTimer);
      reject(error);
    };
    const resolveOnce = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(terminationTimer);
      resolve(value);
    };
    child.stdout.on("data", (chunk) => {
      if (oversized || settled) return;
      const text = chunk.toString();
      if (stdout.length + text.length > maxStdoutLength) {
        oversized = true;
        try {
          terminateProcess(child, platform, killProcess, killTree, env, "SIGTERM");
        } catch {}
        terminationTimer = setTimeout(() => {
          try {
            terminateProcess(child, platform, killProcess, killTree, env, "SIGKILL");
          } catch {}
          rejectOnce(new Error(`npm outdated output exceeded ${maxStdoutLength} characters.`));
        }, terminationGracePeriodMs);
        return;
      }
      stdout += text;
    });
    child.stderr.on("data", (chunk) => {
      stderr = `${stderr}${chunk}`.slice(-4000);
    });
    child.on("error", rejectOnce);
    child.on("close", (code) => {
      if (oversized)
        return rejectOnce(new Error(`npm outdated output exceeded ${maxStdoutLength} characters.`));
      if (code !== 0 && !stdout.trim())
        return rejectOnce(new Error(stderr || `npm outdated exited with ${code}.`));
      try {
        resolveOnce(JSON.parse(stdout || "{}"));
      } catch {
        // Reject through the settlement helper so timers are cleared and later events are ignored.
        rejectOnce(new Error("npm outdated returned invalid JSON."));
      }
    });
  });
}
