import { readCanonicalOrder } from "../../../validation/shared/conventions/read-canonical-order.mjs";

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
  const npm = packageJson?.eliware?.apply?.includes("npm-published");
  if (!npm && readme.includes("npmjs.com"))
    return "README.md must not include npm branding without npm-published.";
  const badges = {
    npm: `[![npm](https://img.shields.io/npm/v/${name})](https://www.npmjs.com/package/${name})`,
    License: `[![License](https://img.shields.io/github/license/${repository.slice(19)})](https://github.com/${repository.slice(19)}/blob/main/LICENSE)`,
    CI: `[![CI](https://github.com/${repository.slice(19)}/actions/workflows/ci.yaml/badge.svg)](https://github.com/${repository.slice(19)}/actions/workflows/ci.yaml)`,
  };
  const order = readCanonicalOrder("readme-sections.yaml").badgeOrder;
  const badgeLine = `${name} ${order
    .filter((badge) => badge !== "npm" || npm)
    .map((badge) => badges[badge])
    .join(" ")}`;
  const lines = readme.split(/\r?\n/u);
  return lines[0] === expectedLogoHeader() && lines[2] === badgeLine
    ? null
    : "README.md must begin with the canonical logo header and title badge row.";
}

function expectedLogoHeader() {
  return "# [![eliware.org](https://eliware.org/logos/brand.png)](https://discord.gg/M6aTR9eTwN)";
}
