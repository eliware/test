import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolveGitExecutable } from "./resolve-git-executable.mjs";

const execFileAsync = promisify(execFile);

export async function inspectGitIgnorePaths(root, paths, runGit = execFileAsync, resolveGit = resolveGitExecutable) {
  const normalizedPaths = paths.map((path) => path.replaceAll("\\", "/"));
  if (normalizedPaths.length === 0) return new Set();
  let stdout;
  try {
    ({ stdout } = await runGit(
      resolveGit(),
      ["-C", root, "check-ignore", "--no-index", "--", ...normalizedPaths],
      { windowsHide: true },
    ));
  } catch (error) {
    if (error?.code !== 1) return null;
    stdout = error.stdout ?? "";
  }
  return new Set(stdout.split(/\r?\n/u).filter(Boolean).map((path) => path.replaceAll("\\", "/")));
}

export async function gitIgnores(root, path, runGit, resolveGit) {
  const normalizedPath = path.replaceAll("\\", "/");
  const ignored = await inspectGitIgnorePaths(root, [normalizedPath], runGit, resolveGit);
  return ignored === null ? null : ignored.has(normalizedPath);
}
