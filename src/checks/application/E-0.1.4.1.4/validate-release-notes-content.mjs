import { removeMarkdownCode } from "../../general/E-0.1.0.1.4/extract-markdown-links.mjs";
import { validateReleaseNoteSections } from "./validate-release-note-sections.mjs";
import { validateReleaseVersionHistory } from "./validate-release-version-history.mjs";

export function validateReleaseNotesContent(content, packageVersion) {
  const errors = [];
  const normalized = content.replace(/^\uFEFF/u, "");
  const originalLines = normalized.split(/\r?\n/u);
  const lines = removeMarkdownCode(normalized).split(/\r?\n/u);
  if (originalLines[0] !== "# Release Notes")
    errors.push("RELEASE_NOTES.md must begin with # Release Notes.");
  if (lines.filter((line) => /^#\s/u.test(line)).length !== 1)
    errors.push("RELEASE_NOTES.md must contain one level-one title.");
  errors.push(...validateReleaseNoteSections(lines));
  const titles = lines.filter((line) => /^##\s/u.test(line));
  if (!titles.length)
    errors.push("RELEASE_NOTES.md must contain an Unreleased or versioned entry.");
  if (titles.includes("## Unreleased") && titles[0] !== "## Unreleased")
    errors.push("Unreleased must appear before versioned entries.");
  if (titles.filter((title) => title === "## Unreleased").length > 1)
    errors.push("RELEASE_NOTES.md must contain at most one Unreleased section.");
  const entries = titles.filter((title) => title !== "## Unreleased");
  if (!entries.length)
    errors.push("RELEASE_NOTES.md must contain at least one versioned release entry.");
  errors.push(...validateReleaseVersionHistory(entries, packageVersion));
  return errors;
}
