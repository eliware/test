import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function readIgnoredTrackedPaths(root, runGit = execFileAsync) {
  try {
    const { stdout } = await runGit(
      "git",
      ["-C", root, "ls-files", "--cached", "--ignored", "--exclude-standard", "-z"],
      { windowsHide: true, encoding: "buffer" },
    );
    return stdout.toString("utf8").split("\0").filter(Boolean);
  } catch {
    return null;
  }
}
