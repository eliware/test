import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../../check-result.mjs";
import { parseReleaseNotes } from "./parse-release-notes.mjs";
import { validateReleaseNoteContent } from "./validate-release-note-content.mjs";
import { validateReleaseNoteOrder } from "./validate-release-note-order.mjs";

export const ruleId = "A-1.26.0";
export const parentRuleId = "E-1.26";

function hasReleaseNotesLink(readme) {
  const lines = readme.split(/\r?\n/u);
  const linksHeading = lines.findIndex((line) => /^## Links\s*$/u.test(line));
  if (linksHeading < 0) return false;
  const nextSection = lines.findIndex((line, index) => index > linksHeading && /^##\s/u.test(line));
  const linksSection = lines
    .slice(linksHeading + 1, nextSection < 0 ? undefined : nextSection)
    .join("\n");
  return /\[[^\]]+\]\((?:\.\/)?RELEASE_NOTES\.md(?:#[^)]+)?\)/iu.test(linksSection);
}

export async function run({ root, packageJson }) {
  let notes;
  let readme;
  try {
    [notes, readme] = await Promise.all([
      readFile(join(root, "RELEASE_NOTES.md"), "utf8"),
      readFile(join(root, "README.md"), "utf8"),
    ]);
  } catch {
    return fail(
      ruleId,
      "RELEASE_NOTES.md and README.md are required for release-bearing repositories.",
    );
  }

  const parsed = parseReleaseNotes(notes);
  if (parsed.error) return fail(ruleId, `RELEASE_NOTES.md ${parsed.error}`);
  const contentError = validateReleaseNoteContent(parsed.entries, packageJson?.version);
  if (contentError) return fail(ruleId, `RELEASE_NOTES.md ${contentError}`);
  const orderError = validateReleaseNoteOrder(parsed.entries);
  if (orderError) return fail(ruleId, `RELEASE_NOTES.md ${orderError}`);
  if (!hasReleaseNotesLink(readme)) return fail(ruleId, "README.md must link RELEASE_NOTES.md.");
  return pass(ruleId);
}
