import parseGitIndexEntries from "../../parse-git-index/entries.mjs";
export default async function readTrackedIndexEntries(root, runGit) {
  const { stdout } = await runGit("git", ["-C", root, "ls-files", "--cached", "--stage", "-z"], {
    windowsHide: true,
    encoding: "buffer",
  });
  return parseGitIndexEntries(stdout);
}
