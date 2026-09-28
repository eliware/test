import { fail, pass } from "../../../check-result.mjs";
import { parseReleaseNotes } from "./parse-release-notes.mjs";
import { validateReleaseNoteContent } from "./validate-release-note-content.mjs";
import { validateReleaseNoteOrder } from "./validate-release-note-order.mjs";
import { validateReadmeReleaseNotesLink } from "./validate-readme-release-notes-link.mjs";
import { readReleaseNoteDocuments } from "./read-release-note-documents.mjs";
import { requiresReleaseNotes } from "./requires-release-notes.mjs";

export const ruleId = "A-0.1.26.0";
export const parentRuleId = "E-0.1.26";

export async function run(context) {
  const { packageJson } = context;
  const releaseNotesRequired = requiresReleaseNotes(packageJson);
  const { notes, readme, failures } = await readReleaseNoteDocuments(context, releaseNotesRequired);
  if (notes !== undefined) {
    const parsed = parseReleaseNotes(notes);
    if (parsed.error) failures.push(`RELEASE_NOTES.md ${parsed.error}`);
    const contentError = validateReleaseNoteContent(parsed.entries, packageJson?.version);
    if (contentError) failures.push(`RELEASE_NOTES.md ${contentError}`);
    const orderError = validateReleaseNoteOrder(parsed.entries);
    if (orderError) failures.push(`RELEASE_NOTES.md ${orderError}`);
  }
  if (readme !== undefined && notes !== undefined) {
    const linkError = validateReadmeReleaseNotesLink(readme);
    if (linkError) failures.push(linkError);
  }
  return failures.length ? fail(ruleId, failures.join("\n")) : pass(ruleId);
}
