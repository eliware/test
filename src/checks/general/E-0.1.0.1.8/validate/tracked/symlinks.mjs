import { parseGitIndexEntries } from "../../parse-git-index/entries.mjs";

export async function validateTrackedSymlinks(root, runGit, isPathExempt = () => false) {
  try {
    const { stdout } = await runGit("git", ["-C", root, "ls-files", "--cached", "--stage", "-z"], {
      windowsHide: true,
      encoding: "buffer",
    });
    const links = parseGitIndexEntries(stdout)
      .filter(({ mode }) => mode === "120000")
      .filter(({ path }) => !isPathExempt(path))
      .map(({ path }) => path);
    return links.length ? [`Tracked symlink entries are prohibited: ${links.join(", ")}.`] : [];
  } catch {
    return ["Git index status could not be read. Tracked symlinks are unknown."];
  }
}
