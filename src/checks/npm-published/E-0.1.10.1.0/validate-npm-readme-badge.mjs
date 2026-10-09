export function validateNpmReadmeBadge(readme, packageJson = {}) {
  const name = packageJson?.name;
  const repositoryValue =
    typeof packageJson?.repository === "string"
      ? packageJson.repository
      : packageJson?.repository?.url;
  const repository =
    typeof repositoryValue === "string"
      ? repositoryValue
          .replace(/^git\+/u, "")
          .replace(/\.git$/u, "")
          .replace(/\/$/u, "")
      : "";
  if (!name || !repository.startsWith("https://github.com/"))
    return "package.json must define a package name and GitHub repository for README badges.";
  const repoPath = repository.slice(19);
  const badges = [
    `[![npm](https://img.shields.io/npm/v/${name})](https://www.npmjs.com/package/${name})`,
    `[![License](https://img.shields.io/github/license/${repoPath})](https://github.com/${repoPath}/blob/main/LICENSE)`,
    `[![CI](https://github.com/${repoPath}/actions/workflows/ci.yaml/badge.svg)](https://github.com/${repoPath}/actions/workflows/ci.yaml)`,
  ];
  return readme.split(/\r?\n/u)[2] === `## ${name} ${badges.join(" ")}`
    ? null
    : "README.md must include the canonical npm, License, and CI badges.";
}
