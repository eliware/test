import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import { requiredIgnoreCases, validateRequiredIgnoreRules } from "./validate-ignore-patterns.mjs";

const executeFile = promisify(execFile);

export async function validateGitHygiene(root, runGit = executeFile, { readText = readFile } = {}) {
  const errors = [];
  try {
    const ignoreText = await readText(`${root}/.gitignore`, "utf8");
    errors.push(...validateRequiredIgnoreRules(ignoreText));
  } catch {
    errors.push(".gitignore could not be read to check required ignore rules.");
  }
  for (const [path, shouldIgnore] of requiredIgnoreCases) {
    try {
      const result = await runGit("git", ["-C", root, "check-ignore", "--quiet", path], {
        windowsHide: true,
      });
      const code = result.code ?? 0;
      if (code !== 0 && shouldIgnore) errors.push(`${path} must be ignored.`);
      if (code === 0 && !shouldIgnore) errors.push(`${path} must not be ignored.`);
    } catch (error) {
      if (error.code === "ENOENT" || error.code !== 1)
        errors.push(`Git ignore rules could not be inspected for ${path}.`);
      else if (shouldIgnore) errors.push(`${path} must be ignored.`);
    }
  }
  try {
    const { stdout } = await runGit(
      "git",
      ["-C", root, "ls-files", "--cached", "--ignored", "--exclude-standard", "-z"],
      { windowsHide: true, encoding: "buffer" },
    );
    const ignored = stdout.toString("utf8").split("\0").filter(Boolean);
    if (ignored.length)
      errors.push(`Tracked or staged paths match ignore rules: ${ignored.join(", ")}.`);
  } catch {
    errors.push("Git index status could not be read; tracked ignore status is unknown.");
  }
  try {
    const { stdout } = await runGit("git", ["-C", root, "ls-files", "--cached", "--stage", "-z"], {
      windowsHide: true,
      encoding: "buffer",
    });
    const links = stdout
      .toString("utf8")
      .split("\0")
      .filter((entry) => entry.startsWith("120000 "))
      .map((entry) => entry.slice(entry.indexOf("\t") + 1));
    if (links.length) errors.push(`Tracked symlink entries are prohibited: ${links.join(", ")}.`);
  } catch {
    errors.push("Git index status could not be read; tracked symlinks are unknown.");
  }
  return errors;
}
