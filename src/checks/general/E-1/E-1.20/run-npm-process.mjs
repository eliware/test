import { spawn } from "node:child_process";

export function runNpmProcess(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      shell: false,
      stdio: ["ignore", "ignore", "pipe"],
      env: { ...process.env, npm_config_loglevel: "error" },
    });
    let stderr = "";
    child.stderr.on("data", (chunk) => { stderr = `${stderr}${chunk}`.slice(-4000); });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, stderr }));
  });
}
