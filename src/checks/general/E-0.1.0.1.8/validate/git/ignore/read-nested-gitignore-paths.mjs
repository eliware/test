import { parseGitNulPaths } from "../../../parse-git-index/paths.mjs";

export async function readNestedGitignorePaths(root, runGit) {
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
    return {
      paths: [
        ...new Set([
          ...parseGitNulPaths(tracked.stdout),
          ...parseGitNulPaths(untracked.stdout),
          ...parseGitNulPaths(ignored.stdout),
        ]),
      ],
    };
  } catch {
    return { error: "Repository ignore files could not be listed. Nested overrides are unknown." };
  }
}
