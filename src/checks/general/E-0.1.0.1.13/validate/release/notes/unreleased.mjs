import { removeMarkdownCode } from "../../../../E-0.1.0.1.4/extract-markdown/remove-markdown-code.mjs";

export function validateNoUnreleasedReleaseNotes(content) {
  const prose = removeMarkdownCode(content.replace(/^\uFEFF/u, ""));
  return /\bunreleased\b/iu.test(prose)
    ? ["RELEASE_NOTES.md must not contain the word Unreleased."]
    : [];
}
