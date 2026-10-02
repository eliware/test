export function validateReadmeLinks(
  readme,
  packageJson = {},
  _sections,
  { docsRequired = false, releaseNotesPresent = false } = {},
) {
  const repository =
    typeof packageJson?.repository === "string"
      ? packageJson.repository
      : packageJson?.repository?.url;
  const repositoryUrl = normalizeRepositoryUrl(repository);
  if (!repositoryUrl) {
    return "README.md repository links require a valid GitHub repository URL in package.json.";
  }
  const homepage = packageJson?.homepage;
  if (typeof homepage !== "string" || !homepage.trim()) {
    return "package.json.homepage must define the README Home Page link target.";
  }

  const linksContent = readSectionContent(readme, "Links");
  const links = [...linksContent.matchAll(/\[([^\]]+)\]\(([^)]+)\)/gu)];
  const repositoryPath = repositoryUrl.replace("https://github.com/", "");
  const requiredLinks = [
    ["Home Page", homepage],
    ["GitHub repository", `${repositoryUrl}.git`],
    ["Eliware", "https://eliware.org"],
    ["GitHub organization", `https://github.com/${repositoryPath.split("/")[0]}`],
    ["Discord", "https://discord.gg/M6aTR9eTwN"],
    ["specifications", "specs/README.md"],
  ];
  if (docsRequired) requiredLinks.push(["docs", "docs/README.md"]);
  if (releaseNotesPresent) requiredLinks.push(["Release Notes", "RELEASE_NOTES.md"]);
  const npmPublished = packageJson?.eliware?.apply?.includes("npm-published") === true;
  const npmUrl = `https://www.npmjs.com/package/${packageJson?.name ?? ""}`;
  if (npmPublished) requiredLinks.push(["npm Package", npmUrl]);
  const missing = requiredLinks.find(
    ([label, target]) =>
      !links.some(
        ([, linkedLabel, linkedTarget]) => linkedLabel === label && linkedTarget === target,
      ),
  );
  const hasNpmLink = links.some(([, , target]) =>
    /^https:\/\/(?:www\.)?npmjs\.com\/package\//iu.test(target),
  );
  if (missing || (!npmPublished && hasNpmLink)) {
    return `README.md Links section must include the exact ${missing?.[0] ?? "profile-appropriate package"} link.`;
  }
  return null;
}

export function normalizeRepositoryUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  const normalized = value
    .replace(/^git\+/u, "")
    .replace(/\/+$/u, "")
    .replace(/\.git$/u, "")
    .replace(/\/+$/u, "");
  return /^https:\/\/github\.com\/[^/]+\/[^/]+$/u.test(normalized) ? normalized : null;
}

function readSectionContent(readme, heading) {
  const lines = readme.split(/\r?\n/u);
  const start = lines.findIndex((line) => new RegExp(`^##\\s+${heading}\\s*$`, "iu").test(line));
  if (start < 0) return "";
  const end = lines.findIndex((line, index) => index > start && /^#{1,6}\s+\S/u.test(line));
  return lines.slice(start + 1, end < 0 ? lines.length : end).join("\n");
}
