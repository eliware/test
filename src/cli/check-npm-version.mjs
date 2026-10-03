import { execFile } from "node:child_process";
import semver from "semver";

export async function checkNpmVersion(executeProcess = execFile, platform = process.platform) {
  let output;
  try {
    output = await new Promise((resolve, reject) => {
      const windows = platform === "win32";
      executeProcess(
        windows ? "cmd.exe" : "npm",
        windows ? ["/d", "/s", "/c", "npm --version"] : ["--version"],
        { encoding: "utf8", windowsHide: true },
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
