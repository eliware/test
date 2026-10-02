import { normalizeRepositoryUrl } from "./validate-readme-links.mjs";

export function validateReadmePackageBadges(readme, packageJson = {}) {
  const packageName = packageJson?.name;
  if (typeof packageName !== "string" || !packageName) {
    return "README.md requires package.json.name to define its package title and badges.";
  }
  const heading = readme.split(/\r?\n/u).find((line) => line.startsWith("## "));
  if (!heading) return "README.md must use the standard package heading.";
  const repository =
    typeof packageJson?.repository === "string"
      ? packageJson.repository
      : packageJson?.repository?.url;
  const repositoryUrl = normalizeRepositoryUrl(repository);
  if (!repositoryUrl)
    return "README.md badges require a valid GitHub repository URL in package.json.";

  const repositoryPath = repositoryUrl.replace("https://github.com/", "");
  const badges = [
    ...(packageJson?.eliware?.apply?.includes("npm-published")
      ? [
          `[![npm](https://img.shields.io/npm/v/${packageName})](https://www.npmjs.com/package/${packageName})`,
        ]
      : []),
    `[![License](https://img.shields.io/github/license/${repositoryPath})](https://github.com/${repositoryPath}/blob/main/LICENSE)`,
    `[![CI](https://github.com/${repositoryPath}/actions/workflows/ci.yml/badge.svg)](https://github.com/${repositoryPath}/actions/workflows/ci.yml)`,
  ];
  const expectedHeading = `## ${packageName} ${badges.join(" ")}`;
  return heading === expectedHeading
    ? null
    : "README.md title and separate npm, license, and CI badges must exactly match the canonical package and repository targets.";
}
