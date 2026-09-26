export function validateReadmeReleaseNotesLink(readme) {
  const lines = readme.split(/\r?\n/u);
  const linksHeading = lines.findIndex((line) => /^## Links\s*$/u.test(line));
  if (linksHeading < 0) return "README.md must link RELEASE_NOTES.md.";
  const nextSection = lines.findIndex((line, index) => index > linksHeading && /^##\s/u.test(line));
  const linksSection = lines
    .slice(linksHeading + 1, nextSection < 0 ? undefined : nextSection)
    .join("\n");
  return /\[[^\]]+\]\((?:\.\/)?RELEASE_NOTES\.md(?:#[^)]+)?\)/iu.test(linksSection)
    ? null
    : "README.md must link RELEASE_NOTES.md.";
}
