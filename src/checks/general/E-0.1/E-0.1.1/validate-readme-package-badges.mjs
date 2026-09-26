export function validateReadmePackageBadges(readme, packageJson = {}) {
  const lines = readme.split(/\r?\n/u);
  const packageName = packageJson?.name;
  const heading = packageName
    ? lines.find((line) => line.startsWith(`## ${packageName} `))
    : lines.find((line) => /^## @eliware\/[^ ]+ /u.test(line));
  if (!heading) return "README.md must use the standard package heading.";

  const headingPackageName = packageName ?? heading.match(/^## ([^ ]+)/u)?.[1];
  const hasNpmBadge = /!\[npm\s+version\][^\n]*npmjs\.com\/package\//iu.test(heading);
  const npmPublished = packageJson?.eliware?.apply?.includes("npm-published") === true;
  if (
    npmPublished &&
    !new RegExp(`npmjs\\.com\\/package\\/${escapeRegExp(headingPackageName)}\\b`, "u").test(heading)
  ) {
    return "README.md must include the npm version badge for the package named in package.json.";
  }

  if (!npmPublished && hasNpmBadge) {
    return "Repositories that do not apply the npm-published profile must not include an npm version badge.";
  }
  if (!/\[!\[license\][\s\S]*?\]\(LICENSE\)/iu.test(heading)) {
    return "README.md must include the license badge.";
  }
  if (
    !/\[!\[CI\]\([^\s)]*\/actions\/workflows\/ci\.yml\/badge\.svg\)\]\([^\s)]*\/actions\/workflows\/ci\.yml\)/u.test(
      heading,
    )
  ) {
    return "README.md CI badge must use and link to the canonical .github/workflows/ci.yml workflow.";
  }
  return null;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
