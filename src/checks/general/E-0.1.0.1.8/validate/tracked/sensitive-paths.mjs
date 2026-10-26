import { parseGitIndexEntries } from "../../parse-git-index/entries.mjs";
import { isSensitivePath } from "./is/sensitive-path.mjs";

export async function validateTrackedSensitivePaths(root, runGit, isPathExempt = () => false) {
  try {
    const { stdout } = await runGit("git", ["-C", root, "ls-files", "--cached", "--stage", "-z"], {
      windowsHide: true,
      encoding: "buffer",
    });
    const paths = parseGitIndexEntries(stdout)
      .map(({ path }) => path)
      .filter((path) => !isPathExempt(path) && isSensitivePath(path));
    return paths.length ? [`Tracked sensitive paths are prohibited: ${paths.join(", ")}.`] : [];
  } catch {
    return ["Git index status could not be read. Sensitive paths are unknown."];
  }
}
