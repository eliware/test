import { readSection } from "./read-readme-section.mjs";

export function validateReadmeLinks(readme, packageJson = {}) {
  const repository =
    typeof packageJson?.repository === "string"
      ? packageJson.repository
      : packageJson?.repository?.url;
  const repositoryUrl =
    repository === undefined || repository === null
      ? "https://github.com/eliware"
      : normalizeRepositoryUrl(repository);
  if (!repositoryUrl) {
    return "README.md repository links require a valid GitHub repository URL in package.json.";
  }

  const linksContent = readSection(readme, "Links");
  const npmPublished = packageJson?.eliware?.apply?.includes("npm-published") === true;
  const repositoryPath = repositoryUrl.replace("https://github.com/", "").split("/");
  const organizationUrl = `https://github.com/${repositoryPath[0]}`;
  const packageUrl = `https://www.npmjs.com/package/${packageJson?.name ?? "@eliware/fixture"}`;
  if (
    !/^##\s+Links\s*$/imu.test(readme) ||
    !/https:\/\/eliware\.org(?:\/[^\s)]*)?/iu.test(linksContent) ||
    !hasExactUrl(linksContent, organizationUrl) ||
    (repository && !hasExactUrl(linksContent, repositoryUrl)) ||
    (npmPublished && packageJson?.name && !hasExactUrl(linksContent, packageUrl)) ||
    (!npmPublished && /https:\/\/(?:www\.)?npmjs\.com\/package\//iu.test(linksContent))
  ) {
    return "README.md must include the standard Links section.";
  }
  return null;
}

export function normalizeRepositoryUrl(value) {
  if (value === undefined || value === null) return "https://github.com/eliware/fixture";
  if (typeof value !== "string" || !value.trim()) return null;
  const normalized = value
    .replace(/^git\+/u, "")
    .replace(/\/+$/u, "")
    .replace(/\.git$/u, "")
    .replace(/\/+$/u, "");
  return /^https:\/\/github\.com\/[^/]+\/[^/]+$/u.test(normalized) ? normalized : null;
}

function hasExactUrl(content, url) {
  return new RegExp(`${escapeRegExp(url)}(?:\\)|\\s|$)`, "iu").test(content);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
