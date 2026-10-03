import { normalizeRepositoryUrl } from "./validate-readme-links.mjs";

export function validateReadmePackageBadges(readme, packageJson = {}) {
  const packageName = packageJson?.name;
  if (typeof packageName !== "string" || !packageName) {
    return "README.md requires package.json.name to define its package title and badges.";
  }
  const lines = readme.split(/\r?\n/u);
  const title = lines.find((line) => line.startsWith(`${packageName} `));
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
  const expectedTitle = `${packageName} ${badges.join(" ")}`;
  return title === expectedTitle
    ? null
    : "README.md title and separate npm, license, and CI badges must exactly match the canonical package and repository targets.";
}
