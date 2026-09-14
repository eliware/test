const STANDARD_BRAND_LINE = "# [![eliware.org](https://eliware.org/logos/brand.png)](https://discord.gg/M6aTR9eTwN)";

export function validateReadmeRequiredContent(readme, packageJson = {}, { examplesRequired = true } = {}) {
  const lines = readme.split(/\r?\n/);
  if (lines[0] !== STANDARD_BRAND_LINE) return "README.md must begin with the standard Eliware branding line.";
  const packageName = packageJson?.name;
  const heading = packageName
    ? lines.find((line) => line.startsWith(`## ${packageName} `))
    : lines.find((line) => /^## @eliware\/[^ ]+ /.test(line));
  if (!heading) return "README.md must use the standard package heading.";
  const headingPackageName = packageName || heading.match(/^## ([^ ]+)/u)[1];
  if (packageJson?.publishConfig?.access === "public" && !new RegExp(`npmjs\\.com\\/package\\/${escapeRegExp(headingPackageName)}\\b`, "u").test(heading)) return "README.md must include the npm version badge for the package named in package.json.";
  if (!/\[!\[license\][\s\S]*?\]\(LICENSE\)/iu.test(heading)) return "README.md must include the license badge.";
  if (!/\[!\[CI\][\s\S]*?actions\/workflows/iu.test(heading)) return "README.md must include the GitHub CI badge.";
  if (!readme.includes("Documentation:") || !/\[docs\]\((?:\.\/)?docs\/README\.md\)/u.test(readme) || !/\[specifications\]\((?:\.\/)?specs\/README\.md\)/u.test(readme) || (examplesRequired && !/\[examples\]\((?:\.\/)?examples\/README\.md\)/u.test(readme))) return "README.md must include the standard Documentation navigation links.";
  for (const section of ["Purpose", "Requirements", "Setup", "Configuration", "Usage", "Validation", "Operations", "Security", "Support", "License"]) {
    if (!new RegExp(`^##\\s+${section}\\s*$`, "im").test(readme))
      return `README.md must include the ${section} section.`;
  }
  const supportIndex = readme.search(/^##\s+Support\s*$/im);
  const linksIndex = readme.search(/^##\s+Links\s*$/im);
  const licenseIndex = readme.search(/^##\s+License\s*$/im);
  const supportContent = sectionContent(readme, supportIndex);
  if (supportIndex < 0 || !/https:\/\/discord\.gg\/M6aTR9eTwN/iu.test(supportContent) || !/eliware\.org on Discord/iu.test(supportContent)) {
    return "README.md must include the standard Discord support block.";
  }
  const repository = typeof packageJson?.repository === "string" ? packageJson.repository : packageJson?.repository?.url;
  const repositoryUrl = normalizeRepositoryUrl(repository);
  const repositoryPath = repositoryUrl.replace("https://github.com/", "").split("/");
  const organizationUrl = `https://github.com/${repositoryPath[0]}`;
  const packageUrl = `https://www.npmjs.com/package/${headingPackageName}`;
  const linksContent = sectionContent(readme, linksIndex);
  if (linksIndex < 0 || !/https:\/\/eliware\.org(?:\/[^\s)]*)?/iu.test(linksContent) || !hasExactUrl(linksContent, organizationUrl) || !hasExactUrl(linksContent, repositoryUrl) || (packageName && !hasExactUrl(linksContent, packageUrl))) {
    return "README.md must include the standard Links section.";
  }
  if (licenseIndex < 0 || !/\[license\]\(LICENSE\)/iu.test(sectionContent(readme, licenseIndex))) return "README.md must link the repository LICENSE file from its License section.";
  return null;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeRepositoryUrl(value) {
  if (typeof value !== "string" || !value.trim()) return "https://github.com/eliware";
  const normalized = value.replace(/^git\+/, "").replace(/\.git$/, "").replace(/\/$/, "");
  if (!normalized.startsWith("https://github.com/")) return "https://github.com/eliware";
  const repositoryPath = normalized.replace("https://github.com/", "").split("/");
  return repositoryPath[0] ? normalized : "https://github.com/eliware";
}

function sectionContent(readme, start) {
  if (start < 0) return "";
  const content = readme.slice(start);
  const nextSection = content.search(/\n##\s+/u);
  return nextSection < 0 ? content : content.slice(0, nextSection);
}

function hasExactUrl(content, url) {
  return new RegExp(`${escapeRegExp(url)}(?:\\)|\\s|$)`, "iu").test(content);
}
