import { spawn } from "node:child_process";

export function readOutdatedDependencies(root, spawnProcess = spawn) {
  return new Promise((resolve, reject) => {
    const npmExecutable = process.platform === "win32" ? process.execPath : "npm";
    const npmArgs = process.platform === "win32"
      ? [`${process.env.ProgramFiles ?? "C:\\Program Files"}\\nodejs\\node_modules\\npm\\bin\\npm-cli.js`, "outdated", "--json"]
      : ["outdated", "--json"];
    const child = spawnProcess(npmExecutable, npmArgs, {
      cwd: root,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, npm_config_loglevel: "error" },
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr = `${stderr}${chunk}`.slice(-4000); });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0 && !stdout.trim()) return reject(new Error(stderr || `npm outdated exited with ${code}.`));
      try { resolve(JSON.parse(stdout || "{}")); } catch { reject(new Error("npm outdated returned invalid JSON.")); }
    });
  });
}

export function formatOutdatedDependencies(outdated) {
  return Object.entries(outdated ?? {}).map(([name, info]) => `${name} (${info.current ?? "unknown"} -> ${info.latest ?? info.wanted ?? "unknown"})`);
}
