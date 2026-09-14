import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function readTrackedPaths(root) {
  const { stdout } = await execFileAsync("git", ["-C", root, "ls-files", "-z"], { windowsHide: true });
  return stdout.split("\0").filter(Boolean);
}
