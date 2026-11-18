import removeMarkdownCode from "../../../../../E-0.1.0.1.4/extract-markdown/remove-markdown-code.mjs";
import validateReleaseNoteSections from "../../note-sections.mjs";
import validateReleaseVersionHistory from "../../version-history.mjs";
import releaseEntryHeadings from "../headings.mjs";
export default function validateReleaseNotesBody(content, packageVersion) {
  const lines = removeMarkdownCode(content).split(/\r?\n/u);
  const errors = validateReleaseNoteSections(lines);
  const titles = releaseEntryHeadings(content);
  if (!titles.length)
    errors.push("RELEASE_NOTES.md must contain at least one versioned release entry.");
  errors.push(...validateReleaseVersionHistory(titles, packageVersion));
  return errors;
}
