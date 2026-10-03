import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function readTrackedSymlinks(root, runGit = execFileAsync) {
  try {
    const { stdout } = await runGit("git", ["-C", root, "ls-files", "--cached", "--stage", "-z"], {
      windowsHide: true,
      encoding: "buffer",
    });
    return stdout
      .toString("utf8")
      .split("\0")
      .filter((record) => record.startsWith("120000 "))
      .map((record) => record.slice(record.indexOf("\t") + 1));
  } catch {
    return null;
  }
}
