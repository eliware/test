import { parseGitNulPaths } from "../../../parse-git-index-output.mjs";

export async function validateNestedGitIgnoreFiles(root, runGit, isPathExempt = () => false) {
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
        "--exclude-standard",
        "-z",
        "--",
        ":(glob)**/.gitignore",
      ],
      { windowsHide: true, encoding: "buffer" },
    );
    const ignored = await runGit(
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
    const nested = new Set(
      [
        ...parseGitNulPaths(tracked.stdout),
        ...parseGitNulPaths(untracked.stdout),
        ...parseGitNulPaths(ignored.stdout),
      ].filter(
        (path) => path.endsWith("/.gitignore") && path !== ".gitignore" && !isPathExempt(path),
      ),
    );
    return nested.size
      ? [`Nested .gitignore files are prohibited: ${[...nested].join(", ")}.`]
      : [];
  } catch {
    return ["Repository ignore files could not be listed. Nested overrides are unknown."];
  }
}
