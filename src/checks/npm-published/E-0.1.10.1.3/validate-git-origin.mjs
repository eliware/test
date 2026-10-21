import { normalizeRepositoryUrl } from "./normalize-repository-url.mjs";

export async function validateGitOrigin(root, repositoryUrl, runGit) {
  const expected = normalizeRepositoryUrl(repositoryUrl);
  if (!expected) return ["package.json.repository.url must identify a GitHub repository."];
  try {
    const { stdout } = await runGit("git", ["-C", root, "remote", "get-url", "origin"], {
      windowsHide: true,
      encoding: "utf8",
    });
    if (normalizeRepositoryUrl(stdout) !== expected)
      return ["Git origin must match package.json.repository.url."];
    return [];
  } catch {
    return ["Git origin could not be read."];
  }
}
