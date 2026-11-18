import parseReleaseTags from "./parse-release-tags.mjs";
export default async function readReleaseTags(root, runGit) {
  try {
    const history = await runGit("git", ["-C", root, "rev-parse", "--is-shallow-repository"], {
      encoding: "utf8",
      windowsHide: true,
    });
    if (String(history.stdout).trim() === "true")
      return {
        error: "Full Git tag history is required for release-note validation.",
      };
    const { stdout } = await runGit("git", ["-C", root, "tag", "--list"], {
      encoding: "utf8",
      windowsHide: true,
    });
    return { tags: parseReleaseTags(stdout) };
  } catch {
    return {
      error: "Repository tags could not be read for release-note validation.",
    };
  }
}
