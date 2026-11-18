import { execFile } from "node:child_process";
import { promisify } from "node:util";
const runFile = promisify(execFile);
async function findIgnoredRepositoryPaths(root) {
  try {
    const { stdout } = await runFile(
      "git",
      ["-C", root, "ls-files", "--others", "--ignored", "--exclude-standard", "--directory", "-z"],
      {
        encoding: "buffer",
        windowsHide: true,
      },
    );
    return new Set(
      stdout
        .toString("utf8")
        .split("\0")
        .filter(Boolean)
        .map((path) => path.replace(/\/$/u, "")),
    );
  } catch {
    return new Set();
  }
}
export default findIgnoredRepositoryPaths;
