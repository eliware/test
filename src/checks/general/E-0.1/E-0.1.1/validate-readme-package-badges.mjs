import { normalizeRepositoryUrl } from "./validate-readme-links.mjs";

export function validateReadmePackageBadges(readme, packageJson = {}) {
  const packageName = packageJson?.name;
  if (typeof packageName !== "string" || !packageName) {
    return "README.md requires package.json.name to define its package title and badges.";
  }
  const lines = readme.split(/\r?\n/u);
  const firstHeadingIndex = lines.findIndex((line) => line.startsWith("## "));
  const headingIndex = lines.findIndex((line) => line.startsWith(`## ${packageName} `));
  const heading = lines[headingIndex];
  if (headingIndex < 0) return "README.md must use the standard package heading.";
  const contentsIndex = lines.findIndex((line) => line === "## Table of Contents");
  if (contentsIndex >= 0 && headingIndex > contentsIndex)
    return "README.md package title must precede the Table of Contents.";
  if (headingIndex !== firstHeadingIndex)
    return "README.md package title must be the first level-two heading.";
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
    `[![CI](https://github.com/${repositoryPath}/actions/workflows/ci.yaml/badge.svg)](https://github.com/${repositoryPath}/actions/workflows/ci.yaml)`,
  ];
  const expectedHeading = `## ${packageName} ${badges.join(" ")}`;
  return heading === expectedHeading
    ? null
    : "README.md title and separate npm, license, and CI badges must exactly match the canonical package and repository targets.";
}
