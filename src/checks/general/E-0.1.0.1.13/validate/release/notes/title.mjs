import { removeMarkdownCode } from "../../../../../general/E-0.1.0.1.4/extract-markdown/remove-markdown-code.mjs";
import { validateNoUnreleasedReleaseNotes } from "./unreleased.mjs";

export function validateReleaseNotesTitle(content) {
  const errors = [];
  const normalized = content.replace(/^\uFEFF/u, "");
  const originalLines = normalized.split(/\r?\n/u);
  const lines = removeMarkdownCode(normalized).split(/\r?\n/u);
  errors.push(...validateNoUnreleasedReleaseNotes(normalized));
  if (originalLines[0] !== "# Release Notes")
    errors.push("RELEASE_NOTES.md must begin with # Release Notes.");
  if (lines.filter((line) => /^#\s/u.test(line)).length !== 1)
    errors.push("RELEASE_NOTES.md must contain one level-one title.");
  return errors;
}
