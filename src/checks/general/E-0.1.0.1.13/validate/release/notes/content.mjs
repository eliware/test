import { removeMarkdownCode } from "../../../../../general/E-0.1.0.1.4/extract-markdown/remove-markdown-code.mjs";
import { validateReleaseNoteSections } from "../note-sections.mjs";
import { validateReleaseVersionHistory } from "../version-history.mjs";
import { releaseEntryHeadings } from "./headings.mjs";
import { validateReleaseNotesTitle } from "./title.mjs";

export function validateReleaseNotesContent(content, packageVersion) {
  const errors = validateReleaseNotesTitle(content);
  const normalized = content.replace(/^\uFEFF/u, "");
  const lines = removeMarkdownCode(normalized).split(/\r?\n/u);
  errors.push(...validateReleaseNoteSections(lines));
  const titles = releaseEntryHeadings(normalized);
  if (!titles.length)
    errors.push("RELEASE_NOTES.md must contain at least one versioned release entry.");
  errors.push(...validateReleaseVersionHistory(titles, packageVersion));
  return errors;
}
