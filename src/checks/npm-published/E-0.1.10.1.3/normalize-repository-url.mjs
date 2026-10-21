export function normalizeRepositoryUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  const match =
    /^(?:git\+)?(?:https:\/\/github\.com\/|ssh:\/\/git@github\.com\/|git@github\.com:)([^/?#]+)\/([^/?#]+?)(?:\.git)?\/?$/iu.exec(
      value.trim(),
    );
  if (!match || match.slice(1).some((part) => part === "." || part === "..")) return null;
  return `github.com/${match[1].toLowerCase()}/${match[2].toLowerCase()}`;
}
