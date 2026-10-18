import { parseGitNulPaths } from "../../../parse-git-index-output.mjs";

export async function validateTrackedIgnoredPaths(root, runGit, isPathExempt = () => false) {
  try {
    const { stdout } = await runGit(
      "git",
      ["-C", root, "ls-files", "--cached", "--ignored", "--exclude-standard", "-z"],
      { windowsHide: true, encoding: "buffer" },
    );
    const ignored = parseGitNulPaths(stdout).filter((path) => !isPathExempt(path));
    return ignored.length
      ? [`Tracked or staged paths match ignore rules: ${ignored.join(", ")}.`]
      : [];
  } catch {
    return ["Git index status could not be read. Tracked ignore status is unknown."];
  }
}
