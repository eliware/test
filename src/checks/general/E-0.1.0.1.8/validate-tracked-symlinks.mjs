import { parseGitIndexEntries } from "./parse-git-index-output.mjs";

export async function validateTrackedSymlinks(root, runGit) {
  try {
    const { stdout } = await runGit("git", ["-C", root, "ls-files", "--cached", "--stage", "-z"], {
      windowsHide: true,
      encoding: "buffer",
    });
    const links = parseGitIndexEntries(stdout)
      .filter(({ mode }) => mode === "120000")
      .map(({ path }) => path);
    return links.length ? [`Tracked symlink entries are prohibited: ${links.join(", ")}.`] : [];
  } catch {
    return ["Git index status could not be read; tracked symlinks are unknown."];
  }
}
