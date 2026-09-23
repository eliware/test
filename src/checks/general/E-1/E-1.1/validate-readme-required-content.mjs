import { expectedReadmeHeadings } from "./read-readme-sections.mjs";

const STANDARD_BRAND_LINE = "# [![eliware.org](https://eliware.org/logos/brand.png)](https://discord.gg/M6aTR9eTwN)";

export function validateReadmeRequiredContent(readme, packageJson = {}, { examplesRequired = true } = {}) {
  const lines = readme.split(/\r?\n/);
  if (lines[0] !== STANDARD_BRAND_LINE) return "README.md must begin with the standard Eliware branding line.";
  const headings = lines.map((line, index) => ({ line, index })).filter(({ line }) => /^##\s+[^#]/u.test(line));
  const tocIndex = headings.find(({ line }) => /^##\s+Table of Contents\s*$/iu.test(line))?.index ?? -1;
  const expected = expectedReadmeHeadings(packageJson);
  const requiredHeadings = expected.slice(1);
  const requiredIndices = requiredHeadings.map((heading) => headings.find(({ line }) => new RegExp(`^##\\s+${escapeRegExp(heading)}\\s*$`, "iu").test(line))?.index ?? -1);
  if (tocIndex < 0) return "README.md must contain the required top-level headings in order with a Table of Contents.";
  if (headings.filter(({ index }) => index < tocIndex).length !== 1) return "README.md must not add top-level sections before the Table of Contents.";
  const missingHeading = requiredHeadings.find((heading, index) => requiredIndices[index] < 0);
  if (missingHeading) return `README.md must include the ${missingHeading === "Links" ? "standard Links" : missingHeading} section.`;
  const actualHeadingSequence = headings.filter(({ index }) => index >= tocIndex).map(({ line }) => line.replace(/^##\s+/u, "").trim());
  if (actualHeadingSequence.some((heading) => !expected.includes(heading))) return "README.md top-level headings must exactly match the general and applied-profile order; do not add unapproved headings.";
  if (requiredIndices[requiredHeadings.indexOf("Links")] < requiredIndices[requiredHeadings.indexOf("License")]) return "README.md must contain the required top-level headings in order with a Table of Contents.";
  if (requiredIndices.some((index, position) => position > 0 && index <= requiredIndices[position - 1])) return "README.md must contain the required top-level headings in order with a Table of Contents.";
  if (JSON.stringify(actualHeadingSequence) !== JSON.stringify(expected)) return "README.md top-level headings must exactly match the general and applied-profile order; do not add unapproved headings.";
  const tocContent = lines.slice(tocIndex, requiredIndices[0]).join("\n");
  const tocLinks = [...tocContent.matchAll(/\[[^\]]*\]\(#([^)]+)\)/gu)].map((match) => match[1]);
  const expectedTocLinks = requiredHeadings.map((heading) => heading.toLowerCase().replaceAll(" ", "-"));
  if (JSON.stringify(tocLinks) !== JSON.stringify(expectedTocLinks)) return "README.md Table of Contents must link every required heading exactly once, in document order.";
  const packageName = packageJson?.name;
  const publicPackage = (packageJson?.private !== true && packageJson?.publishConfig?.access === "public")
    || packageJson?.eliware?.apply?.includes("npm-published");
  const heading = packageName
    ? lines.find((line) => line.startsWith(`## ${packageName} `))
    : lines.find((line) => /^## @eliware\/[^ ]+ /.test(line));
  if (!heading) return "README.md must use the standard package heading.";
  const headingPackageName = packageName || heading.match(/^## ([^ ]+)/u)[1];
  const hasNpmBadge = /!\[npm\s+version\][^\n]*npmjs\.com\/package\//iu.test(heading);
  if (publicPackage && !new RegExp(`npmjs\\.com\\/package\\/${escapeRegExp(headingPackageName)}\\b`, "u").test(heading)) return "README.md must include the npm version badge for the package named in package.json.";
  const explicitlyNonPublic = packageJson?.private === true || packageJson?.publishConfig?.access === "restricted";
  if (explicitlyNonPublic && hasNpmBadge) return "Non-public packages must not include an npm version badge.";
  if (!/\[!\[license\][\s\S]*?\]\(LICENSE\)/iu.test(heading)) return "README.md must include the license badge.";
  if (!/\[!\[CI\][\s\S]*?actions\/workflows/iu.test(heading)) return "README.md must include the GitHub CI badge.";
  if (!readme.includes("Documentation:") || !/\[docs\]\((?:\.\/)?docs\/README\.md\)/u.test(readme) || !/\[specifications\]\((?:\.\/)?specs\/README\.md\)/u.test(readme) || (examplesRequired && !/\[examples\]\((?:\.\/)?examples\/README\.md\)/u.test(readme))) return "README.md must include the standard Documentation navigation links.";
  const supportIndex = readme.search(/^##\s+Support\s*$/im);
  const linksIndex = readme.search(/^##\s+Links\s*$/im);
  const licenseIndex = readme.search(/^##\s+License\s*$/im);
  const supportContent = sectionContent(readme, supportIndex);
  if (supportIndex < 0 || !/https:\/\/discord\.gg\/M6aTR9eTwN/iu.test(supportContent) || !/eliware\.org on Discord/iu.test(supportContent)) {
    return "README.md must include the standard Discord support block.";
  }
  const repository = typeof packageJson?.repository === "string" ? packageJson.repository : packageJson?.repository?.url;
  const repositoryUrl = repository === undefined || repository === null
    ? "https://github.com/eliware"
    : normalizeRepositoryUrl(repository);
  if (!repositoryUrl) return "README.md repository links require a valid GitHub repository URL in package.json.";
  const repositoryPath = repositoryUrl.replace("https://github.com/", "").split("/");
  const organizationUrl = `https://github.com/${repositoryPath[0]}`;
  const packageUrl = `https://www.npmjs.com/package/${headingPackageName}`;
  const linksContent = sectionContent(readme, linksIndex);
  if (linksIndex < 0 || !/https:\/\/eliware\.org(?:\/[^\s)]*)?/iu.test(linksContent) || !hasExactUrl(linksContent, organizationUrl) || (repository && !hasExactUrl(linksContent, repositoryUrl)) || (packageName && !hasExactUrl(linksContent, packageUrl))) {
    return "README.md must include the standard Links section.";
  }
  if (licenseIndex < 0 || !/\[license\]\(LICENSE\)/iu.test(sectionContent(readme, licenseIndex))) return "README.md must link the repository LICENSE file from its License section.";
  return null;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizeRepositoryUrl(value) {
  if (value === undefined || value === null) return "https://github.com/eliware/fixture";
  if (typeof value !== "string" || !value.trim()) return null;
  const normalized = value.replace(/^git\+/, "").replace(/\/+$/, "").replace(/\.git$/, "").replace(/\/+$/, "");
  if (!/^https:\/\/github\.com\/[^/]+\/[^/]+$/u.test(normalized)) return null;
  return normalized;
}

function sectionContent(readme, start) {
  const content = readme.slice(start);
  return content.split(/\n##\s+/u, 1)[0];
}

function hasExactUrl(content, url) {
  return new RegExp(`${escapeRegExp(url)}(?:\\)|\\s|$)`, "iu").test(content);
}
