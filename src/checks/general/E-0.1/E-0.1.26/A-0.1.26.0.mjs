import { readRepositoryText } from "../../../read-repository-text.mjs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../../check-result.mjs";
import { parseReleaseNotes } from "./parse-release-notes.mjs";
import { validateReleaseNoteContent } from "./validate-release-note-content.mjs";
import { validateReleaseNoteOrder } from "./validate-release-note-order.mjs";
import { validateReadmeReleaseNotesLink } from "./validate-readme-release-notes-link.mjs";

export const ruleId = "A-0.1.26.0";
export const parentRuleId = "E-0.1.26";

export async function run(context) {
  const { root, packageJson } = context;
  let notes;
  let readme;
  try {
    [notes, readme] = await Promise.all([
      readFile(join(root, "RELEASE_NOTES.md"), "utf8"),
      readRepositoryText(context, join(root, "README.md")),
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
  const linkError = validateReadmeReleaseNotesLink(readme);
  if (linkError) return fail(ruleId, linkError);
  return pass(ruleId);
}
