export function validateReadmePackageBadges(readme, packageJson = {}) {
  const lines = readme.split(/\r?\n/u);
  const packageName = packageJson?.name;
  const heading = packageName
    ? lines.find((line) => line.startsWith(`## ${packageName} `))
    : lines.find((line) => /^## @eliware\/[^ ]+ /u.test(line));
  if (!heading) return "README.md must use the standard package heading.";

  const headingPackageName = packageName ?? heading.match(/^## ([^ ]+)/u)?.[1];
  const hasNpmBadge = /!\[npm\s+version\][^\n]*npmjs\.com\/package\//iu.test(heading);
  const publicPackage =
    (packageJson?.private !== true && packageJson?.publishConfig?.access === "public") ||
    packageJson?.eliware?.apply?.includes("npm-published");
  if (
    publicPackage &&
    !new RegExp(`npmjs\\.com\\/package\\/${escapeRegExp(headingPackageName)}\\b`, "u").test(heading)
  ) {
    return "README.md must include the npm version badge for the package named in package.json.";
  }

  const explicitlyNonPublic =
    packageJson?.private === true || packageJson?.publishConfig?.access === "restricted";
  if (explicitlyNonPublic && hasNpmBadge) {
    return "Non-public packages must not include an npm version badge.";
  }
  if (!/\[!\[license\][\s\S]*?\]\(LICENSE\)/iu.test(heading)) {
    return "README.md must include the license badge.";
  }
  if (!/\[!\[CI\][\s\S]*?actions\/workflows/iu.test(heading)) {
    return "README.md must include the GitHub CI badge.";
  }
  return null;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
