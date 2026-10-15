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

function normalizeRepositoryUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  const match =
    /^(?:git\+)?(?:https:\/\/github\.com\/|ssh:\/\/git@github\.com\/|git@github\.com:)([^/?#]+)\/([^/?#]+?)(?:\.git)?\/?$/iu.exec(
      value.trim(),
    );
  if (!match || match.slice(1).some((part) => part === "." || part === "..")) return null;
  return `github.com/${match[1].toLowerCase()}/${match[2].toLowerCase()}`;
}
