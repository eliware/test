import {
  extractMarkdownLinks,
  removeMarkdownCode,
} from "../../general/E-0.1.0.1.4/extract-markdown-links.mjs";

export function validateReleaseNotesLink(readme) {
  const lines = removeMarkdownCode(readme).split(/\r?\n/u);
  const linksHeading = lines.findIndex((line) => line === "## Links");
  if (linksHeading < 0) return ["README.md Links must contain RELEASE_NOTES.md."];
  const nextHeading = lines.findIndex((line, index) => index > linksHeading && /^##\s/u.test(line));
  const section = lines
    .slice(linksHeading + 1, nextHeading < 0 ? undefined : nextHeading)
    .join("\n");
  const links = extractMarkdownLinks(section).map(({ reference }) => reference?.split("#")[0]);
  return links.some((reference) => ["RELEASE_NOTES.md", "./RELEASE_NOTES.md"].includes(reference))
    ? []
    : ["README.md Links must contain a link to RELEASE_NOTES.md."];
}
