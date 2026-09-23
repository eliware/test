import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolveGitExecutable } from "../E-1.22/resolve-git-executable.mjs";

const execFileAsync = promisify(execFile);

export async function readTrackedPaths(root, executable = resolveGitExecutable()) {
  try {
    const { stdout } = await execFileAsync(executable, ["-C", root, "ls-files", "-z"], { windowsHide: true });
    return stdout.split("\0").filter(Boolean);
  } catch {
    return null;
  }
}
