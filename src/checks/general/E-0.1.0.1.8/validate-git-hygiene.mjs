import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import { requiredIgnoreCases, validateRequiredIgnoreRules } from "./validate-ignore-patterns.mjs";

const executeFile = promisify(execFile);

export async function validateGitHygiene(root, runGit = executeFile, { readText = readFile } = {}) {
  const errors = [];
  try {
    errors.push(...validateRequiredIgnoreRules(await readText(`${root}/.gitignore`, "utf8")));
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
    const tracked = await runGit(
      "git",
      ["-C", root, "ls-files", "--cached", "-z", "--", ":(glob)**/.gitignore"],
      { windowsHide: true, encoding: "buffer" },
    );
    const untracked = await runGit(
      "git",
      [
        "-C",
        root,
        "ls-files",
        "--others",
        "--ignored",
        "--exclude-standard",
        "-z",
        "--",
        ":(glob)**/.gitignore",
      ],
      { windowsHide: true, encoding: "buffer" },
    );
    const nested = [...parseNulPaths(tracked.stdout), ...parseNulPaths(untracked.stdout)].filter(
      (path) => path.endsWith("/.gitignore") && path !== ".gitignore",
    );
    if (nested.length) errors.push(`Nested .gitignore files are prohibited: ${nested.join(", ")}.`);
  } catch {
    errors.push("Repository ignore files could not be listed; nested overrides are unknown.");
  }
  try {
    const { stdout } = await runGit(
      "git",
      ["-C", root, "ls-files", "--cached", "--ignored", "--exclude-standard", "-z"],
      { windowsHide: true, encoding: "buffer" },
    );
    const ignored = parseNulPaths(stdout);
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
    const links = parseIndexEntries(stdout)
      .filter(({ mode }) => mode === "120000")
      .map(({ path }) => path);
    if (links.length) errors.push(`Tracked symlink entries are prohibited: ${links.join(", ")}.`);
  } catch {
    errors.push("Git index status could not be read; tracked symlinks are unknown.");
  }
  return errors;
}

function parseNulPaths(output) {
  const text = Buffer.isBuffer(output) ? output.toString("utf8") : output;
  if (typeof text !== "string" || (text && !text.endsWith("\0")))
    throw new Error("Git returned incomplete NUL-delimited paths.");
  const paths = text ? text.slice(0, -1).split("\0") : [];
  if (paths.some((path) => !path || path.startsWith("/") || /^[A-Za-z]:/u.test(path)))
    throw new Error("Git returned an invalid repository path.");
  return paths;
}

function parseIndexEntries(output) {
  return parseNulPaths(output).map((entry) => {
    const match = /^(\d{6}) ([0-9a-f]{40}|[0-9a-f]{64}) ([0-3])\t(.+)$/iu.exec(entry);
    if (!match) throw new Error("Git returned an invalid index entry.");
    return { mode: match[1], path: match[4] };
  });
}
