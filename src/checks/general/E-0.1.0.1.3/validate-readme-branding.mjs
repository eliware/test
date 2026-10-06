function repoUrl(packageJson) {
  const value =
    typeof packageJson?.repository === "string"
      ? packageJson.repository
      : packageJson?.repository?.url;
  return typeof value === "string"
    ? value
        .replace(/^git\+/u, "")
        .replace(/\.git$/u, "")
        .replace(/\/$/u, "")
    : "";
}

export function validateReadmeBranding(readme, packageJson = {}) {
  const name = packageJson?.name;
  const repository = repoUrl(packageJson);
  if (!name || !repository.startsWith("https://github.com/"))
    return "package.json must define a package name and GitHub repository for README badges.";
  const npm = packageJson?.eliware?.apply?.includes("npm-published")
    ? `[![npm](https://img.shields.io/npm/v/${name})](https://www.npmjs.com/package/${name}) `
    : "";
  if (!npm && readme.includes("npmjs.com"))
    return "README.md must not include npm branding without npm-published.";
  const badgeLine = `${name} ${npm}[![License](https://img.shields.io/github/license/${repository.slice(19)})](https://github.com/${repository.slice(19)}/blob/main/LICENSE) [![CI](https://github.com/${repository.slice(19)}/actions/workflows/ci.yaml/badge.svg)](https://github.com/${repository.slice(19)}/actions/workflows/ci.yaml)`;
  return readme.split(/\r?\n/u).includes(badgeLine)
    ? null
    : "README.md must show the canonical title, license badge, and CI badge.";
}
