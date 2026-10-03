import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import semver from "semver";
import { npmCommand } from "../checks/npm-command.mjs";

export async function checkNpmVersion({
  executeProcess = execFile,
  platform = process.platform,
  env = process.env,
  workingDirectory = process.cwd(),
  execPath = process.execPath,
  fileExists = existsSync,
} = {}) {
  let output;
  try {
    const activeNpmPath = env?.npm_execpath;
    const [command, prefix] =
      platform === "win32" && !(typeof activeNpmPath === "string" && activeNpmPath.trim())
        ? ["cmd.exe", ["/d", "/s", "/c", "npm"]]
        : npmCommand(
            platform,
            activeNpmPath ?? "",
            execPath,
            fileExists,
            workingDirectory,
            env?.PATH ?? env?.Path,
          );
    output = await new Promise((resolve, reject) => {
      executeProcess(
        command,
        [...prefix, "--version"],
        { encoding: "utf8", windowsHide: true, cwd: workingDirectory, env: { ...env } },
        (error, stdout) => (error ? reject(error) : resolve(stdout)),
      );
    });
  } catch {
    return "Cannot determine the active npm version; npm 12 or later is required.";
  }

  const version = semver.valid(String(output).trim());
  if (!version) return "Cannot determine the active npm version; npm 12 or later is required.";
  if (semver.major(version) < 12) {
    return `npm 12 or later is required for validation; found npm ${version}.`;
  }
  return null;
}
