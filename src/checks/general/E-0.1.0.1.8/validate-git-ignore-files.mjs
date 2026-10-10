import { parseGitNulPaths } from "./parse-git-index-output.mjs";

export async function validateGitIgnoreFiles(root, runGit) {
  const errors = [];
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
    const nested = [
      ...parseGitNulPaths(tracked.stdout),
      ...parseGitNulPaths(untracked.stdout),
    ].filter((path) => path.endsWith("/.gitignore") && path !== ".gitignore");
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
    const ignored = parseGitNulPaths(stdout);
    if (ignored.length)
      errors.push(`Tracked or staged paths match ignore rules: ${ignored.join(", ")}.`);
  } catch {
    errors.push("Git index status could not be read; tracked ignore status is unknown.");
  }
  return errors;
}
