import { parseGitIndexEntries } from "../parse-git-index-output.mjs";

const protectedNames = new Set(["id_rsa", "credentials"]);

export async function validateTrackedSensitivePaths(root, runGit) {
  try {
    const { stdout } = await runGit("git", ["-C", root, "ls-files", "--cached", "--stage", "-z"], {
      windowsHide: true,
      encoding: "buffer",
    });
    const paths = parseGitIndexEntries(stdout)
      .map(({ path }) => path)
      .filter((path) => path.split("/").some((part) => protectedNames.has(part.toLowerCase())));
    return paths.length ? [`Tracked sensitive paths are prohibited: ${paths.join(", ")}.`] : [];
  } catch {
    return ["Git index status could not be read; sensitive paths are unknown."];
  }
}
