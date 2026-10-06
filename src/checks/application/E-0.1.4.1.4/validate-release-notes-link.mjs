export function validateReleaseNotesLink(readme) {
  const lines = readme.split(/\r?\n/u);
  const linksHeading = lines.findIndex((line) => line === "## Links");
  if (linksHeading < 0) return ["README.md Links must contain RELEASE_NOTES.md."];
  const nextHeading = lines.findIndex((line, index) => index > linksHeading && /^##\s/u.test(line));
  const section = lines
    .slice(linksHeading + 1, nextHeading < 0 ? undefined : nextHeading)
    .join("\n");
  return /\[[^\]]+\]\((?:\.\/)?RELEASE_NOTES\.md(?:#[^)]+)?\)/u.test(section)
    ? []
    : ["README.md Links must contain a link to RELEASE_NOTES.md."];
}
