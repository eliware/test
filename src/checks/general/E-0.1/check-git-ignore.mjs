import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function isIgnoredByGit(root, path) {
  try {
    await execFileAsync("git", ["-C", root, "check-ignore", "-q", "--no-index", "--", path], { windowsHide: true });
    return true;
  } catch {
    return false;
  }
}
