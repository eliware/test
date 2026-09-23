import { spawn } from "node:child_process";
import { npmCommand } from "../../npm-command.mjs";

const maxStdoutLength = 100_000;

export function readOutdatedDependencies(root, spawnProcess = spawn) {
  return new Promise((resolve, reject) => {
    const [npmExecutable, prefix] = npmCommand();
    const npmArgs = [...prefix, "outdated", "--json"];
    const child = spawnProcess(npmExecutable, npmArgs, {
      cwd: root,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, npm_config_loglevel: "error" },
    });
    let stdout = "";
    let stderr = "";
    let oversized = false;
    child.stdout.on("data", (chunk) => {
      if (oversized) return;
      const text = chunk.toString();
      if (stdout.length + text.length > maxStdoutLength) {
        oversized = true;
        try { child.kill?.("SIGTERM"); } catch {}
        return;
      }
      stdout += text;
    });
    child.stderr.on("data", (chunk) => { stderr = `${stderr}${chunk}`.slice(-4000); });
    child.on("error", reject);
    child.on("close", (code) => {
      if (oversized) return reject(new Error(`npm outdated output exceeded ${maxStdoutLength} characters.`));
      if (code !== 0 && !stdout.trim()) return reject(new Error(stderr || `npm outdated exited with ${code}.`));
      try { resolve(JSON.parse(stdout || "{}")); } catch { reject(new Error("npm outdated returned invalid JSON.")); }
    });
  });
}

export function formatOutdatedDependencies(outdated) {
  return Object.entries(outdated ?? {}).map(([name, info]) => `${name} (${info.current ?? "unknown"} -> ${info.latest ?? info.wanted ?? "unknown"})`);
}
